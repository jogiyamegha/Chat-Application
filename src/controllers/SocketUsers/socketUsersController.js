const SocketUsersService = require('../../db/services/socketUsersService');
const { TableFields } = require('../../utils/constants');
const { MongoUtil } = require('../../db/mongoose');
const SocketUsers = require('../../db/models/socketUsers');

exports.createSocketUser = async ( userId, socketId ) => {
    const existing = await SocketUsersService.existsWithUserId(userId);
    await parseAndValidateUser(
        userId,
        socketId,
        async () => {
            if(existing) {
                await SocketUsersService.updateRecord(existing, socketId)
            } else {
                const { createdUserRecord } = SocketUsersService.insertRecord({
                    userId : userId,
                    socketId : socketId
                })
                return { createdUserRecord };
            }
        }
    )
} 

exports.getSocketId = async( userId ) => {
    const s = await SocketUsersService.getSocketId(userId).withSocketId().execute();
    return s[TableFields.ID]
}

exports.updateOnlineStatus = async (senderId) => {
    const id = await SocketUsersService.getSocketUserById(senderId).withBasicInfo().execute();
    if(id) {
        return await SocketUsersService.updateOnlineStatus(id);
    }
}

exports.updateSocketId = async (socketId, userId) => {
    const user = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
    if(user){
        const socketUserId = MongoUtil.toObjectId(user[TableFields.ID]);
        return await SocketUsersService.updateSocketId(socketId, socketUserId);
    }
}

exports.checkOnlineUser = async (id) => {
    const user = await SocketUsersService.getSocketUserByUserId(id).withBasicInfo().execute();
    return user[TableFields.isOnline]
}

async function parseAndValidateUser(
    userId,
    socketId,
    onValidationCompleted = async () => {}
) {
    try {
        let response = await onValidationCompleted({
            [TableFields.userId] : userId,
            [TableFields.socketId] : socketId
        })
        return response;
    } catch (error) {
        throw error;
    }
}