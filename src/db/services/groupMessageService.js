const { TableFields } = require('../../utils/constants');
const GroupMessage = require('../models/groupMessage');

const { MongoUtil } = require('../mongoose');

const GroupMessageService = class {

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

    static updateSeenMsgDefault = async (lastMsgId, chatGroupId, senderId) => {
        return await GroupMessage.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(lastMsgId),
                [TableFields.chatGroupId] : chatGroupId,
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
        var message = new GroupMessage({
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

module.exports = GroupMessageService;