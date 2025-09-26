const MessageService = require('../../db/services/messageService');
const ChatRoomService = require('../../db/services/chatRoomService');
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
            return await MessageService.insertRecord(
                updatedMessageFields
            )
        }
    );
    return record;
}

exports.editMessage = async (req) => {
    const msgId = req.body.messageId;
    const msg = req.body.msg;

    return await MessageService.editMessage(msgId, msg);
}

exports.deleteMessageForEveryone = async (req) => {
    const msgId = req.body.messageId;
    return await MessageService.deleteMessageForEveryone(msgId, msg);
}

exports.deleteMessageForMe = async (req, userId) => {
    const messageId = req.body.messageId;
    const msg = await MessageService.getMessageById(messageId).withBasicInfo().execute();
    if (!msg) {
        throw new ValidationError(ValidationMsgs.MessageNotExists);
    }

    return await MessageService.deleteMessageForMe(msg, userId);
}

exports.updateSeenBy = async (senderId, chatGroupId) => {
    const group = await ChatRoomService.getGroupById(chatGroupId).withBasicInfo().execute();
    const lastMsgId = group[TableFields.lastMessage][TableFields.lastMsgId];
    const lastMsgUserId = group[TableFields.lastMessage][TableFields.senderId];

    if(lastMsgUserId != senderId) {
        await MessageService.addToSeenBy(chatGroupId, senderId)
    }
}

exports.showMessage = async (userId, req, limit, skip ) => {
    const reqBody = req.body;
    const chatGroupId = reqBody[TableFields.chatGroupId];
    const group = await ChatRoomService.getGroupById(chatGroupId).withBasicInfo().execute();
    

    const removedParticipants = group[TableFields.removedParticipants];
    let leftAt;
    for(let i = 0; i < removedParticipants.length; i++) {
        if(removedParticipants[i][TableFields.participantId].toString() === userId.toString()){
            leftAt = removedParticipants[i][TableFields.leftAt]
        }
    }

    const createdAt = group[TableFields.createdAt];
    
    if(!group){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    } else {
        
        return await MessageService.getAllMessages(chatGroupId, createdAt, leftAt, limit, skip);
    }   
}

async function parseAndValidateMessage(
    senderId,
    reqBody,
    existingMessage = {},
    onValidationCompleted = async () => {}
) {
    if(isFieldEmpty(reqBody[TableFields.chatRoomId]), existingMessage[TableFields.chatRoomId]){
        throw new ValidationError(ValidationMsgs.ChatRoomIdEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.message]), existingMessage[TableFields.message]){
        throw new ValidationError(ValidationMsgs.MessageEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.messageType]), existingMessage[TableFields.messageType]){
        throw new ValidationError(ValidationMsgs.MessageTypeEmpty);
    }

    const sender = await UserService.getUserById(senderId).withDetails().execute();

    const chatRoomId = reqBody[TableFields.chatRoomId];
    const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withId().execute();
    if(!chatRoom) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    try {
        let response = await onValidationCompleted({
            [TableFields.chatRoomId] : reqBody[TableFields.chatRoomId],
            [TableFields.isGroupMessage] : chatRoom[TableFields.isGroup],
            [TableFields.senderDetails] : {
                [TableFields.senderId] : sender[TableFields.ID],
                [TableFields.senderName] : sender[TableFields.name_]
            },
            [TableFields.message] : reqBody[TableFields.message],
            [TableFields.messageType] : reqBody[TableFields.messageType],
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