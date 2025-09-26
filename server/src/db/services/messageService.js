const { TableFields } = require('../../utils/constants');
const chatRoom = require('../models/chatRoom');
const Message = require('../models/message');

const { MongoUtil } = require('../mongoose');

const MessageService = class {

    static getMessageById =  (messageId) => {
        return new ProjectionBuilder(
            async function () {
                return await Message.findOne(
                    {
                        [TableFields.ID] : messageId
                    }
                )
            }
        )
    }

    static getAllMessages = async ( chatGroupId, createdAt, leftAt, skip, limit) => {
        skip = skip || 0;
        limit = limit || 0;       

        // const filter = {
        // [TableFields.groupChatId]: MongoUtil.toObjectId(groupId),
        // createdAt: {
        //     $gte: startDate,
        //     ...(endDate ? { $lte: endDate } : {}),
        // },
        // };
    
        // console.log("filter", filter);
        // const messages = await Message.find(filter)
        // .sort({ createdAt: -1 })
        // .limit(100);
    
        // return messages;
        return await GroupMessage.find(
            {
                [TableFields.chatGroupId] : MongoUtil.toObjectId(chatGroupId),
                [TableFields.createdAt] : {
                    $gte: createdAt,
                    ...(leftAt ? { $lte: leftAt } : {})
                }
            }
        ).select('message senderDetails').sort({ createdAt : 1}).limit(parseInt(limit)).skip(parseInt(skip));
    }

    static checkIsMyMessage = async (userId, messageId) => {
        return await Message.exists(
            {
                [TableFields.ID] : messageId,
                [`${TableFields.senderDetails}.${TableFields.senderId}`] : userId
            }
        )
    }

    static getChatHistory = async (chatRoom) => {
        let query = { [TableFields.chatRoomId]: chatRoom._id };

        if (chatRoom[TableFields.clearChat] && chatRoom[TableFields.clearChatAt]) {
            // Only fetch messages after clearChatAt timestamp
            query.createdAt = { $gt: chatRoom[TableFields.clearChatAt] };
        }

        return await Message.find(query).sort({ createdAt: 1 });
    }

    static getChatHistoryForMe = async (chatRoom, userId) => {
        let query = { [TableFields.chatRoomId]: chatRoom._id };

        // Find the logged-in user's participant object
        const participant = chatRoom[TableFields.participants].find(
            (p) => p[TableFields.userId].toString() === userId.toString()
        );

        // Apply clearChatForMe filter if it exists
        if (
            participant &&
            participant[TableFields.clearChatForMe] &&
            participant[TableFields.clearChatForMeAt]
        ) {
            query.createdAt = { $gt: participant[TableFields.clearChatForMeAt] };
        }

        return await Message.find(query).sort({ createdAt: 1 });
    };

    static editMessage = async (msgId, msg) => {
        return await Message.findByIdAndUpdate(
            msgId,
            {
                [TableFields.message] : msg,
                [TableFields.isEdited] : true           
            }
        )
    }

    static deleteMessageForEveryone = async (msgId) => {
        return await Message.findByIdAndUpdate(
            msgId,
            {
                [TableFields.deleteForEveryone] : true           
            }
        )
    }

    static deleteMessageForMe = async (msg, userId) => {
        
        const deleteForMeArray = msg[TableFields.deleteForMe] || [];

        const alreadyExists = deleteForMeArray.some(
            (entry) => entry[TableFields.userId].toString() === userId.toString()
        );

        if (!alreadyExists) {
            msg[TableFields.deleteForMe].push({
                [TableFields.userId]: userId,
            });

            await msg.save(); // persist to DB
        }

        return msg;
    };



    static updateSeenMsgDefault = async (lastMsgId, chatRoomId, senderId) => {
        return await Message.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(lastMsgId),
                [TableFields.chatRoomId] : chatRoomId,
                [`${TableFields.seenBy}.${TableFields.userId}`] : { $ne: MongoUtil.toObjectId(senderId)}
            },
            {
                $push: {
                    [TableFields.seenBy] : {
                        [TableFields.userId] : MongoUtil.toObjectId(senderId)
                    } 
                }
            }
        );
    }

    static addToSeenBy = async (chatGroupId, senderId) => {
        await GroupMessage.updateMany(
            {
                [TableFields.chatGroupId] : chatGroupId,
                [`${TableFields.seenBy}.${TableFields.userId}`]: { $ne: senderId }
            },
            {
                $push: {
                        [TableFields.seenBy]: {
                            [TableFields.userId]: senderId
                        }
                }
            }
        )
    }

    static insertRecord = async (updatedRoomFields = {}) => {
        var message = new Message({
            ...updatedRoomFields,
        })
    
        let error = message.validateSync();
        if(error) {
            throw error;
        } else {
            let createdRoomRecord = undefined;
            try {
                return await message.save();
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
            projection[TableFields.chatRoomId] = 1;
            projection[TableFields.isGroupMessage] = 1;
            projection[TableFields.senderDetails] = 1;
            projection[TableFields.message] = 1;
            projection[TableFields.messageType] = 1;
            projection[TableFields.deleteForEveryone] = 1;
            projection[TableFields.isEdited] = 1;
            projection[TableFields.deleteForMe] = 1;
            projection[TableFields.receivedBy] = 1;
            projection[TableFields.seenBy] = 1;
            projection[TableFields.reaction] = 1;
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

module.exports = MessageService;