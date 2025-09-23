const UserService = require('../../db/services/userService');
const ChatRoomService = require('../../db/services/chatRoomService');
const { TableFields, ValidationMsgs } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');

exports.removeParticipantsFromGroup = async (req) => {
    const reqBody = req.body;
    const chatRoomId = reqBody.chatRoomId;
    const participant = reqBody[TableFields.participants];

    const groupExists = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
    if(!groupExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const participantExists = await UserService.getUserById(participant).withId().execute();
    if(!participantExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await ChatRoomService.removeParticipantsFromGroup(chatRoomId, participant)
}