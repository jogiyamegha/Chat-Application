const { TableFields, ValidationMsgs } = require('../../utils/constants');
const UserService = require('../services/userService');
const ValidationError = require('../../utils/ValidationError');
const GroupChat = require('../models/groupChat');
const { MongoUtil } = require('../mongoose');

const GroupChatService = class {
    static getGroupById =  ( groupId ) => {
        return new ProjectionBuilder(async function (){
            return await GroupChat.findOne(
                {
                    [TableFields.ID] : MongoUtil.toObjectId(groupId)
                }
            )
        })
    }

    static updateRemoved = async (chatGroupId, participant) => {
        await GroupChat.findByIdAndUpdate(
            chatGroupId,
            {
                $set: {
                    [TableFields.participants] : {
                        [TableFields.userId] : participant[TableFields.participantId],
                        [TableFields.name_] : participant[TableFields.name_],
                        [TableFields.joinedAt] : Date.now(),
                        
                    }
                }
            }
        )
    }

    static updateLastMsg = async (chatGroupId, lastMsgId, lastMsgSenderId, lastMsgSenderName, lastMsg) => {
        return await GroupChat.updateOne(
            {
                [TableFields.ID] : chatGroupId
            },
            {
                $set: {
                    [TableFields.lastMessage] : {
                        [TableFields.lastMsgId] : lastMsgId, 
                        [TableFields.message] : lastMsg,
                        [TableFields.senderName] : lastMsgSenderName,
                        [TableFields.senderId] : lastMsgSenderId
                    }
                }
            }
        )
    }

    static existsParticipant =  (groupId, participantId) => {
        return new ProjectionBuilder(async function() {
            return await GroupChat.findOne(
                {
                    [TableFields.ID] : groupId,
                    [TableFields.participants + '.' + TableFields.userId] : participantId
                }
            )
        })
    }

    static addToParticipantsArray = async (participant, groupId) => {
        await GroupChat.findByIdAndUpdate(
            groupId, 
            {
                $push: {
                    [TableFields.participants] : participant,
                },
                $inc : {
                    [TableFields.participantsCount] : 1
                }
            },
        )
    }

    static addParticipant = async (userId, chatGroupId) => {
        const user = await UserService.getUserById(userId).withBasicInfo().execute();
        await GroupChat.findByIdAndUpdate(
            chatGroupId, 
            {
                $push: {
                    [TableFields.participants] : {
                        [TableFields.userId] : user[TableFields.ID],
                        [TableFields.name_] : user[TableFields.name_]
                    }
                },
                $inc : {
                    [TableFields.participantsCount] : 1
                }
            },
        )
    }

    static removeFromRemovedParticipants = async (userId, groupId) => {
        const group = await GroupChatService.getGroupById(groupId).withBasicInfo().execute();

        const removedParticipantsArray = group[TableFields.removedParticipants];
        console.log(removedParticipantsArray);
        console.log(removedParticipantsArray.length);

        if(removedParticipantsArray.length != 0) {
            const participantIndex = removedParticipantsArray.findIndex(
                p => p[TableFields.participantId].toString() === userId.toString()
            )

            if(participantIndex === -1 ){
                throw new ValidationError(ValidationMsgs.ParticipantNotExistInGroup)
            }

            const userRemoved = removedParticipantsArray[participantIndex];
            console.log("userRemoved ss", userRemoved);

            return await GroupChat.updateOne(
                {
                    [TableFields.ID] : groupId
                },
                {
                    $pull : {
                        [TableFields.removedParticipants] : removedParticipantsArray[participantIndex]
                    }
                }
            )
        }
    }

    static removeParticipantsFromGroup = async ( groupId, participant ) => {

        const group = await GroupChatService.getGroupById(groupId).withBasicInfo().execute();
        if(!group) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
        const groupParticipant = group[TableFields.participants];

        const participantIndex = groupParticipant.findIndex(
            p => p[TableFields.userId].toString() === participant.toString()
        )

        if(participantIndex === -1 ){
            throw new ValidationError(ValidationMsgs.ParticipantNotExistInGroup)
        }

        const userRemoved = groupParticipant[participantIndex];
        console.log(userRemoved);

        await GroupChat.updateOne(
            {
                [TableFields.ID] : groupId
            },
            {
                $push: {
                    [TableFields.removedParticipants] : {
                        [TableFields.participantId] : userRemoved[TableFields.userId],
                        [TableFields.name_] : userRemoved[TableFields.name_],
                        [TableFields.joinedAt] : userRemoved[TableFields.joinedAt],
                        [TableFields.leftAt] : Date.now()
                    }
                }
            }
        )

        return await GroupChat.updateOne(
            {
                [TableFields.ID] : groupId
            }, 
            {
                $pull : {
                    [TableFields.participants] : groupParticipant[participantIndex]
                },
                $inc: {
                    [TableFields.participantsCount] : -1
                }
            }
        )
    }

    static updateParticipantsCount = async (groupId, participantCount) => {
        await GroupChat.findByIdAndUpdate(
            groupId,
            {
                [TableFields.participantsCount] : participantCount
            }
        )
    }
    
    static insertRecord = async (updatedRoomFields = {}) => {
        var group = new GroupChat({
            ...updatedRoomFields,
        })
    
        let error = group.validateSync();
        if(error) {
            throw error;
        } else {
            let createdRoomRecord = undefined;
            try {
                return await group.save();
                // return { createdRoomRecord };
            } catch (e) {
                if(createdRoomRecord){
                    await createdRoomRecord.delete()
                }
                throw e;
            }
        }
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection =  {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.profilePicture] = 1;
            projection[TableFields.groupName] = 1;
            projection[TableFields.description] = 1;
            projection[TableFields.participants] = 1;
            projection[TableFields.participantsCount] = 1;
            projection[TableFields.removedParticipants] = 1;
            return this; 
        };
        // this.withRemovedDetails = () => {
        //     projection[TableFields.c]
        // }
        this.withName = () => {
            projection[TableFields.groupName] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        this.execute = async () => {
            return await methodToExecute.call(projection);
        }

    }
}

module.exports = GroupChatService;