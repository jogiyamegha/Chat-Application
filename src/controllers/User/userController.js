const UserService = require('../../db/services/userService');
const ChatRoomService = require('../../db/services/chatRoomService');
const { TableFields, ValidationMsgs } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');

exports.addParticipantsToGroup = async ( req ) => {
    const reqBody = req.body;
    const groupId = reqBody.groupId;
    const participantsToAdd = reqBody[TableFields.participants];

    const groupExists = await ChatRoomService.getGroupById(groupId).withBasicInfo().execute();
    if(!groupExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    for(let i = 0; i < participantsToAdd.length; i++){
        const checkParticipantExists = await ChatRoomService.existsParticipant( groupId ,participantsToAdd[i]).withId().execute();
        
        if(checkParticipantExists == null) {
            const participantDetails = await UserService.getUserById(participantsToAdd[i]).withParticipant().execute();

            const participant = {
                [TableFields.userId] : participantDetails[TableFields.ID],
                [TableFields.name_] : participantDetails[TableFields.name_],
                [TableFields.isAdmin] : false,
                [TableFields.joinedAt] : Date.now()
            }
            await ChatRoomService.addToParticipantsArray(participant, groupId)
        }
    }
}   

exports.removeParticipantsFromGroup = async (req) => {
    const reqBody = req.body;
    const groupId = reqBody.groupId;
    const participant = reqBody[TableFields.participants];

    const groupExists = await ChatRoomService.getGroupById(groupId).withBasicInfo().execute();
    if(!groupExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const participantExists = await UserService.getUserById(participant).withId().execute();
    if(!participantExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await ChatRoomService.removeParticipantsFromGroup(groupId, participant)
}