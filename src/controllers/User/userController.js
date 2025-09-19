const UserService = require('../../db/services/userService');
const GroupChatService = require('../../db/services/groupChatService');
const { TableFields, ValidationMsgs } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');

exports.addParticipantsToGroup = async ( req ) => {
    const reqBody = req.body;
    const groupId = reqBody.groupId;
    const participantsToAdd = reqBody[TableFields.participants];

    const groupExists = await GroupChatService.getGroupById(groupId).withBasicInfo().execute();
    if(!groupExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    for(let i = 0; i < participantsToAdd.length; i++){
        const checkParticipantExists = await GroupChatService.existsParticipant( groupId ,participantsToAdd[i]).withId().execute();
        
        if(checkParticipantExists == null) {
            const participantDetails = await UserService.getUserById(participantsToAdd[i]).withParticipant().execute();

            const participant = {
                [TableFields.userId] : participantDetails[TableFields.ID],
                [TableFields.name_] : participantDetails[TableFields.name_],
                [TableFields.isAdmin] : false,
                [TableFields.joinedAt] : Date.now()
            }
            await GroupChatService.addToParticipantsArray(participant, groupId)
        }
    }
}   

exports.removeParticipantsFromGroup = async (req) => {
    const reqBody = req.body;
    const groupId = reqBody.groupId;
    const participant = reqBody[TableFields.participants];

    const groupExists = await GroupChatService.getGroupById(groupId).withBasicInfo().execute();
    if(!groupExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const participantExists = await UserService.getUserById(participant).withId().execute();
    if(!participantExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await GroupChatService.removeParticipantsFromGroup(groupId, participant)
}