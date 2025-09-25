const ChatRoom = require('../../db/models/chatRoom');
const ChatRoomService = require('../../db/services/chatRoomService');
const MessageService = require('../../db/services/messageService');
const UserService = require('../../db/services/userService');
const { TableFields, ValidationMsgs } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');

exports.createChatRoom = async (userId, req) => {
    const reqBody = req.body;

    const isGroup = reqBody[TableFields.isGroup];
    
    if(isGroup) {
        let record = await parseAndValidateGroup(
            userId,
            reqBody,
            undefined,
            async (updatedGroupFields) => {
                return await ChatRoomService.insertGroupRecord(
                    updatedGroupFields
                );
            }
        );
        return record;
    } else {
        let record = await parseAndValidatePersonalChat(
            userId,
            reqBody,
            undefined,
            async (updatedGroupFields) => {
                return await ChatRoomService.insertPersonalChatRecord(
                    updatedGroupFields
                );
            }
        );
        return record;
    }
}

exports.addParticipantsToGroup = async (chatRoomId, req) => {
    const reqBody = req.body;

    const participantsToAdd = reqBody[TableFields.participants];
    const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
    const existingParticipants = chatRoom[TableFields.participants];

    for(let i = 0; i < participantsToAdd.length; i++) {
        const checkParticipantExists = await ChatRoomService.existsParticipant(chatRoomId, participantsToAdd[i]);
        if(checkParticipantExists) {
            throw new ValidationError(ValidationMsgs.ParticipantAlreadyExists)
        } else {
            const participantDetail = await UserService.getUserById(participantsToAdd[i]).withBasicInfo().execute();
            const participant = {
                [TableFields.userId] : participantDetail[TableFields.ID],
                [TableFields.name_] : participantDetail[TableFields.name_],
                [TableFields.isAdmin] : false,
                [TableFields.joinedAt] : Date.now()

            }
            await ChatRoomService.addToParticipantsArray(participant, chatRoomId)
        }

    }
} 

// exports.createGroup = async (userId, req) => {
//     const reqBody = req.body;

//     let record = await parseAndValidateGroup(
//         userId,
//         reqBody, 
//         undefined,
//         async (updatedGroupFields) => {
//             return await ChatRoomService.insertRecord(
//                 updatedGroupFields
//             );
//         }
//     )
//     return record;
// }

exports.joinToGroup = async(req, userId) => {
    const reqBody = req.body;
    const chatGroupId = reqBody[TableFields.chatRoomId];
   
    await ChatRoomService.addParticipant(userId, chatGroupId);
    await ChatRoomService.removeFromRemovedParticipants(userId, chatGroupId);
}
 
exports.rejoinMember = async (userId, req) => {
    const user = await UserService.getUserById(userId).withBasicInfo().execute();
    if(!user) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    const reqBody = req.body;

    const chatGroupId = reqBody[TableFields.chatGroupId];

    const group = await ChatRoomService.getGroupById(chatGroupId).withBasicInfo().execute();

    const allRemovedParticipants = group[TableFields.removedParticipants];
    for(let i = 0; i < allRemovedParticipants.length; i++) {
        if(allRemovedParticipants[i][TableFields.participantId].toString() === userId.toString()) {
            await ChatRoomService.updateRemoved(chatGroupId, allRemovedParticipants[i])
        }
    }
}

exports.makeOtherParticipantToAdmin = async(userId, req) => {
    const reqBody = req.body;
    const chatRoomId = reqBody[TableFields.chatRoomId];
    const participantId = reqBody[TableFields.participantId];

    const user = await UserService.getUserById(userId).withBasicInfo().execute();
    if(!user) {
        throw new ValidationError(ValidationMsgs.UserNotFound);
    }

    const group = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
    
    return await ChatRoom.updateOne(
        {
            [TableFields.ID]: chatRoomId,
            [TableFields.participants]: {
                $elemMatch: {
                    [TableFields.userId]: participantId
                }
            }
        },
        {
            $set: {
                [`${TableFields.participants}.$.${TableFields.isAdmin}`]: true
            }
        }
    );


}

exports.updateLastMessage = async (msg, chatRoomId, senderId, req) => {
    const lastMsgId = msg[TableFields.ID];
    const lastMsgSenderId = msg[TableFields.senderDetails][TableFields.senderId];
    const lastMsgSenderName = msg[TableFields.senderDetails][TableFields.senderName];
    const lastMsg = msg[TableFields.message];

    await ChatRoomService.updateLastMsg(chatRoomId, lastMsgId, lastMsgSenderId, lastMsgSenderName, lastMsg);

    const user = await UserService.getUserById(senderId).withBasicInfo().execute();

    await MessageService.updateSeenMsgDefault(lastMsgId, chatRoomId, senderId);
}

exports.checkGroupMemberOrNot = async (chatGroupId, userId) => {
    const group = await ChatRoomService.getChatRoomById(chatGroupId).withBasicInfo().execute();
    const allParticipants = group[TableFields.participants];

    for (let i = 0; i < allParticipants.length; i++) {
        if (allParticipants[i][TableFields.userId].toString() === userId.toString()) {
            return true;
        }
    }
    return false;
}

exports.checkIsPastMember = async (chatGroupId, userId) => {
    const group = await ChatRoomService.getGroupById(chatGroupId).withBasicInfo().execute();
    const allRemovedParticipants = group[TableFields.removedParticipants] || 0;

    for(let i = 0; i < allRemovedParticipants.length; i++) {
        if(allRemovedParticipants[i][TableFields.participantId].toString() === userId.toString()) {
            return true;
        }
    }
    return false;
}

exports.updateParticipantsCount = async (group) => {
    const groupId = group[TableFields.ID];
    const participants = group[TableFields.participants];

    const participantCount = participants.length;
    await ChatRoomService.updateParticipantsCount(groupId, participantCount);
}

exports.getGroupMembers = async (chatGroupId) => {
    const group = await ChatRoomService.getChatRoomById(chatGroupId).withBasicInfo().execute();
    return group[TableFields.participants];
}

exports.exitFromGroup = async (req, userId) => {
    const reqBody = req.body;
    const chatGroupId = reqBody[TableFields.chatGroupId];
    const group = await ChatRoomService.getGroupById(chatGroupId).withBasicInfo().execute();
    const groupParticipants = group[TableFields.participants];

    for(let i = 0; i < groupParticipants.length; i++){
        const participantsIds = groupParticipants[i][TableFields.userId];

        if(participantsIds.toString() === userId.toString()){
            await ChatRoomService.removeParticipantsFromGroup(chatGroupId, participantsIds);
            return; 
        }
    }
    // return false;
}

async function parseAndValidateGroup(
    userId,
    reqBody,
    existingGroup = {},
    onValidationCompleted = async () => {}
) {
    if(isFieldEmpty(reqBody[TableFields.isGroup]), existingGroup[TableFields.isGroup]){
        throw new ValidationError(ValidationMsgs.IsGroupEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.groupName]), existingGroup[TableFields.groupName]){
        throw new ValidationError(ValidationMsgs.GroupNameEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.description]), existingGroup[TableFields.description]){
        throw new ValidationError(ValidationMsgs.DescriptionEmpty);
    }
    if(!Array.isArray(reqBody[TableFields.participants] || reqBody[TableFields.participants].length === 0)){
        throw new ValidationError(ValidationMsgs.ParticipantsEmpty)
    }
  
    const participantDetails = await Promise.all(
        reqBody[TableFields.participants].map(async (participantId) => {
            const user = await UserService.getUserById(participantId).withBasicInfo().execute();
            if(!user){
                throw new ValidationError(ValidationMsgs.UserNotFound);
            }
            return {
                [TableFields.userId] : user[TableFields.ID],
                [TableFields.name_] : user[TableFields.name_],
                [TableFields.joinedAt] : Date.now(),
                [TableFields.isAdmin] : participantId === userId
            }
        })
    )

    const uniqueParticipants = Array.from(
        new Map(participantDetails.map(p => [p[TableFields.userId], p])).values()
    );


    const admin = await UserService.getUserById(userId).withBasicInfo().execute()

    const participantId = reqBody[TableFields.participants];
    const participant = await UserService.getUserById(participantId).withBasicInfo().execute();

    try {
        let response = await onValidationCompleted({
            [TableFields.isGroup] : reqBody[TableFields.isGroup],
            [`${TableFields.groupDetails}.${TableFields.groupName}`] : reqBody[TableFields.groupName],
            [`${TableFields.groupDetails}.${TableFields.createdBy}` ] : userId,
            [`${TableFields.groupDetails}.${TableFields.description}`] : reqBody[TableFields.description],
            [TableFields.participants] : uniqueParticipants
        })
        return response;
    } catch (error) {
        throw error;
    }
}

async function parseAndValidatePersonalChat (
    userId,
    reqBody,
    existingGroup = {},
    onValidationCompleted = async () => {}
) {
    if(isFieldEmpty(reqBody[TableFields.isGroup]), existingGroup[TableFields.isGroup]){
        throw new ValidationError(ValidationMsgs.IsGroupEmpty);
    }
    if(!Array.isArray(reqBody[TableFields.participants] || reqBody[TableFields.participants].length === 0)){
        throw new ValidationError(ValidationMsgs.ParticipantsEmpty)
    }

    const participantDetails = await Promise.all(
        reqBody[TableFields.participants].map(async (participantId) => {
            const user = await UserService.getUserById(participantId).withBasicInfo().execute();
            if(!user){
                throw new ValidationError(ValidationMsgs.UserNotFound);
            }
            return {
                [TableFields.userId] : user[TableFields.ID],
                [TableFields.name_] : user[TableFields.name_],
                [TableFields.isAdmin] : user[TableFields.isAdmin],
                [TableFields.joinedAt] : Date.now(),
            }
        })
    )

    const uniqueParticipants = Array.from(
        new Map(participantDetails.map(p => [p[TableFields.userId], p])).values()
    );

    const participantId = reqBody[TableFields.participants];
    try {
        let response = await onValidationCompleted({
            [TableFields.isGroup] : reqBody[TableFields.isGroup],
            [TableFields.personalChatRoomDetails] : {
                [TableFields.userId] : userId,
                [TableFields.receiverId] : reqBody[TableFields.receiverId]
            },
            [TableFields.groupDetails] : {},
            [TableFields.participants] : uniqueParticipants
        })
        return response;
    } catch (error) {
        throw error;
    }

} 

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        return false;
    } else if (existingField) {
        return false;
    }
    return true;
}