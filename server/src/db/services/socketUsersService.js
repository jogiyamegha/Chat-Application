const { TableFields } = require('../../utils/constants');
const SocketUsers = require('../models/socketUsers');
const { MongoUtil } = require('../mongoose');

const SocketUsersService = class {
    static getSocketUserById =  (userId) => {
        return new ProjectionBuilder(async function() {
            return await SocketUsers.findOne(
                {
                    [TableFields.userId] : userId
                }
            )
        })
    }

    static getSocketId = (userId) => {
        return new ProjectionBuilder(async function() {
            return await SocketUsers.findOne(
                {
                    [TableFields.userId] : userId
                }
            )
        })
    }

    static updateOnlineStatus = async (id) => {
        try {
            return await SocketUsers.findByIdAndUpdate(
                id, 
                { $set: { [TableFields.isOnline]: true } },
                { new: true } 
            )
        } catch (error) {
            throw error;
        }
    }

    static getSocketUserByUserId =  (userId) => {
        return new ProjectionBuilder( async function() {
            return await SocketUsers.findOne(
                {
                    [TableFields.userId] : MongoUtil.toObjectId(userId)
                }
            )
        })
    }

    static updateSocketId = async (socketId, socketUserId) => {
        return await SocketUsers.findByIdAndUpdate(
            {
                // [TableFields.ID] : MongoUtil.toObjectId(id)
                [TableFields.ID] : socketUserId
            },
            {
                [TableFields.socketId] : socketId
            }
        )
    }

    static existsWithUserId = async (userId, exceptionId) => {
        return await SocketUsers.exists(
            { 
                [TableFields.userId] : userId,
                ...(exceptionId
                    ? {
                        [TableFields.ID] : { $ne: exceptionId},
                    }
                    : {})
            });
    }

     static updateRecord = async (existingId, socketId) => {
        try { 
            await SocketUsers.findByIdAndUpdate(
                existingId, 
                { 
                    $set: {
                        [TableFields.socketId] : socketId
                    } 
                },
                { new: true}
            )
        } catch (error) {
            throw error;
        }
    }

    static insertRecord = async (updatedUserFields = {}) => {
        var sckUsers = new SocketUsers({
            ...updatedUserFields,
        })

        let error = sckUsers.validateSync();
        if(error) {
            throw error;
        } else  {
            let createdUserRecord = undefined;
            try {
                let createdUserRecord = await sckUsers.save();
                return { createdUserRecord };
            } catch (e) {
                if(createdUserRecord) {
                    await createdUserRecord.delete()
                }
                throw e;
            }
        }
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.userId] = 1;
            projection[TableFields.socketId] = 1;
            projection[TableFields.isOnline] = 1;
           
            return this;
        }
        this.withSocketId = () => {
            projection[TableFields.socketId] = 1;
            return this;
        }
        this.withUserId = () => {
            projection[TableFields.userId] = 1;
            return this;
        }
        this.withOnline = () => {
            projection[TableFields.isOnline] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
       
        this.execute = async() => {
            return await methodToExecute.call(projection);
        }
    }
}

module.exports = SocketUsersService;