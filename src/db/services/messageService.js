const { TableFields } = require('../../utils/constants');
const chatRoom = require('../models/chatRoom');
const Message = require('../models/message');

const { MongoUtil } = require('../mongoose');

const MessageService = class {

    static getAllMessages = async ( chatGroupId, createdAt, leftAt, skip, limit) => {
        skip = skip || 0;
        limit = limit || 0;

        console.log('object');
       

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

module.exports = MessageService;