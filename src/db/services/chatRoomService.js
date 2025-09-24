const { TableFields, ValidationMsgs } = require('../../utils/constants');
const UserService = require('./userService');
const ValidationError = require('../../utils/ValidationError');
const ChatRoom = require('../models/chatRoom');
const { MongoUtil } = require('../mongoose');
const { relativeTimeRounding } = require('moment');

const ChatRoomService = class {

    static chatRoomExists = async (chatRoomId) => {
        return await ChatRoom.exists(
            {
                [TableFields.ID] : chatRoomId
            }
         )
    }
    static getChatRoomById =  ( groupId ) => {
        return new ProjectionBuilder(async function (){
            return await ChatRoom.findOne(
                {
                    [TableFields.ID] : MongoUtil.toObjectId(groupId)
                }
            )
        })
    } 

    static checkUserIsAdmin = async (chatRoomId ,userId) => {
        const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
        const participants = chatRoom[TableFields.participants];
        for(let p of participants) {
            if(p[TableFields.userId].toString() === userId) {
                return p[TableFields.isAdmin]
            }
        }
    }

    static checkIsParticipant = async (chatRoomId, senderId) => {
        const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
        const participantsArray = chatRoom[TableFields.participants];

        for(let i of participantsArray) {
            if(i[TableFields.userId].toString() === senderId) {
                return true;
            }
        } 
        return false;

    }

    static getChatHistory = async (chatGroupId) => {
        return await ChatRoom.find(
            {
                [TableFields.ID] : chatGroupId
            }
        )
    }

    static updateRemoved = async (chatGroupId, participant) => {
        await ChatRoom.findByIdAndUpdate(
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
        return await ChatRoom.updateOne(
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

    static updateClearChat = async (chatRoomId) => {
        return await ChatRoom.updateOne(
            {
                [TableFields.ID] : chatRoomId,
            },
            { 
                $set: {
                    [TableFields.clearChat] : true,
                    [TableFields.clearChatAt] : new Date()
                }
            }
        )
    }

    static updateClearChatForMe = async (chatRoomId, userId) => {
    return await ChatRoom.updateOne(
        {
            [TableFields.ID]: chatRoomId,
            [TableFields.participants]: {
                $elemMatch: {
                    [TableFields.userId]: userId
                }
            }
        },
        {
            $set: {
                [`${TableFields.participants}.$.${TableFields.clearChatForMe}`]: true,
                [`${TableFields.participants}.$.${TableFields.clearChatForMeAt}`]: new Date()
            }
        }
    );
};


    static existsParticipant =  async (groupId, participantId) => {
            return await ChatRoom.exists(
                {
                    [TableFields.ID] : groupId,
                    [TableFields.participants + '.' + TableFields.userId] : participantId
                }
            )
    }

    static addToParticipantsArray = async (participant, groupId) => {
        console.log("kanu");
        await ChatRoom.findByIdAndUpdate(
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
        await ChatRoom.findByIdAndUpdate(
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
        const group = await ChatRoomService.getChatRoomById(groupId).withBasicInfo().execute();

        const removedParticipantsArray = group[TableFields.removedParticipants];
        if(removedParticipantsArray.length != 0) {
            const participantIndex = removedParticipantsArray.findIndex(
                p => p[TableFields.participantId].toString() === userId.toString()
            )

            if(participantIndex === -1 ){
                throw new ValidationError(ValidationMsgs.ParticipantNotExistInGroup)
            }

            const userRemoved = removedParticipantsArray[participantIndex];
            console.log("userRemoved ss", userRemoved);

            return await ChatRoom.updateOne(
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

        const group = await ChatRoomService.getChatRoomById(groupId).withBasicInfo().execute();
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

        await ChatRoom.updateOne(
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

        return await ChatRoom.updateOne(
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
        await ChatRoom.findByIdAndUpdate(
            groupId,
            {
                [TableFields.participantsCount] : participantCount
            }
        )
    }
    
    static insertGroupRecord = async (updatedRoomFields = {}) => {
        var chatRoom = new ChatRoom({
            ...updatedRoomFields,
        })
    
        let error = chatRoom.validateSync();
        if(error) {
            throw error;
        } else {
            let createdRoomRecord = undefined;
            try {
                return await chatRoom.save();
                // return { createdRoomRecord };
            } catch (e) {
                if(createdRoomRecord){
                    await createdRoomRecord.delete()
                }
                throw e;
            }
        }
    }

    static insertPersonalChatRecord = async (updatedRoomFields = {}) => {
                var personalChatRoom = new ChatRoom({
            ...updatedRoomFields,
        })
    
        let error = personalChatRoom.validateSync();
        if(error) {
            throw error;
        } else {
            let createdRoomRecord = undefined;
            try {
                return await personalChatRoom.save();
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
            projection[TableFields.isGroup] = 1;
            projection[TableFields.groupDetails] = 1;
            projection[TableFields.participants] = 1;
            projection[TableFields.participantsCount] = 1;
            projection[TableFields.lastMessage] = 1;
            projection[TableFields.removedParticipants] = 1;
            return this; 
        };
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        this.execute = async () => {
            return await methodToExecute.call(projection);
        }

    }
}

module.exports = ChatRoomService;