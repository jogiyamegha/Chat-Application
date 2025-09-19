const GroupMessageService = require('../../db/services/groupMessageService');
const GroupChatService = require('../../db/services/groupChatService');
const UserService = require('../../db/services/userService');
const { TableFields, ValidationMsgs } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');

exports.sendMessage = async ( senderId, req ) => {
    const reqBody = req.body;

    let record = await parseAndValidateMessage(
        senderId,
        reqBody,
        undefined,
        async (updatedMessageFields) => {
            return await GroupMessageService.insertRecord(
                updatedMessageFields
            )
        }
    );
    return record;
}

exports.updateSeenBy = async (senderId, chatGroupId) => {
    const group = await GroupChatService.getGroupById(chatGroupId).withBasicInfo().execute();
    const lastMsgId = group[TableFields.lastMessage][TableFields.lastMsgId];
    const lastMsgUserId = group[TableFields.lastMessage][TableFields.senderId];

    if(lastMsgUserId != senderId) {
        await GroupMessageService.addToSeenBy(chatGroupId, senderId)
    }
}

exports.showMessage = async (userId, req, limit, skip ) => {
    const reqBody = req.body;
    const chatGroupId = reqBody[TableFields.chatGroupId];
    const group = await GroupChatService.getGroupById(chatGroupId).withBasicInfo().execute();
    
    console.log(group[TableFields.createdAt]);

    const removedParticipants = group[TableFields.removedParticipants];
    console.log(removedParticipants);
    console.log(Array.isArray(removedParticipants));
    console.log(removedParticipants.length);

    let leftAt;
    for(let i = 0; i < removedParticipants.length; i++) {
        console.log(removedParticipants[i][TableFields.participantId]);
        if(removedParticipants[i][TableFields.participantId].toString() === userId.toString()){
            leftAt = removedParticipants[i][TableFields.leftAt]
        }
    }

    console.log("leftAt", leftAt);
    const createdAt = group[TableFields.createdAt];
    
    if(!group){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    } else {
        
        return await GroupMessageService.getAllMessages(chatGroupId, createdAt, leftAt, limit, skip);
    }   
}

async function parseAndValidateMessage(
    senderId,
    reqBody,
    existingMessage = {},
    onValidationCompleted = async () => {}
) {
    if(isFieldEmpty(reqBody[TableFields.chatGroupId]), existingMessage[TableFields.chatGroupId]){
        throw new ValidationError(ValidationMsgs.ChatGroupIdEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.message]), existingMessage[TableFields.message]){
        throw new ValidationError(ValidationMsgs.MessageEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.messageType]), existingMessage[TableFields.messageType]){
        throw new ValidationError(ValidationMsgs.MessageTypeEmpty);
    }

    const sender = await UserService.getUserById(senderId).withDetails().execute();

    const chatGroupId = reqBody[TableFields.chatGroupId];
    const chatGroup = await GroupChatService.getGroupById(chatGroupId).withId().execute();
    if(!chatGroup) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    try {
        let response = await onValidationCompleted({
            [TableFields.chatGroupId] : reqBody[TableFields.chatGroupId],
            [TableFields.senderDetails] : {
                [TableFields.senderId] : sender[TableFields.ID],
                [TableFields.senderName] : sender[TableFields.name_]
            },
            [TableFields.message] : reqBody[TableFields.message],
            [TableFields.messageType] : reqBody[TableFields.messageType],
            [TableFields.seenBy] : {
                [TableFields.userId] : sender[TableFields.ID]
            }
        })
        return response;
    } catch(error) {
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