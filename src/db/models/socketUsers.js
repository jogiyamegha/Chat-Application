const mongoose = require('mongoose');
const { TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');


/** The purpose of this model is to manage connected users.
 * In a chat platform, real-time communication is typically implemented using Socket.IO. Every time a user connects, they're assigned a socket ID. To track who is online, and to send messages to the right socket
 */
const socketUsersSchema = new mongoose.Schema(
    {
        [TableFields.isOnline] : {
            type : Boolean,
            default : false,
        },
        [TableFields.userId] : {
            type : mongoose.Types.ObjectId,
            ref : TableNames.User,
            required : [true, ValidationMsgs.UserIdRequired]
        },
        [TableFields.socketId] : {
            type : String,
            required : true,
            unique : true,
        },
        [TableFields.lastSeen] : {
            type : Date,
        }
    },
    {
        timestamps : true,
        toJSON : {
            transform : function ( doc, ret ) {
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            }
        }
    }
)

const SocketUsers = mongoose.model(TableNames.SocketUsers, socketUsersSchema);
module.exports = SocketUsers;

/**The reason behind taking userId and socketId as a String is that...
 * userId => normally mongodb stores IDs as ObjectId and we receive it as a String.You are not joining or linking this to another collection here — just using it to check which user is online.
 * socketId => This is the unique ID given by Socket.IO when a user connects
 * They are just used to store and compare values.
 */
