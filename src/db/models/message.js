const mongoose = require('mongoose');
const {MessageTypes, TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');

const messageSchema = new mongoose.Schema(
    {
        [TableFields.chatRoomId] : {
            type : mongoose.Types.ObjectId,
            ref : TableNames.ChatRoom,
            required : [true, ValidationMsgs.ChatRoomIdEmpty],
        },
        [TableFields.isGroupMessage] : {
            type : Boolean,
            default : false
        },
        [TableFields.senderDetails] :{
            [TableFields.ID] : false,
            [TableFields.senderId] : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.User,
                required : [ true, ValidationMsgs.SenderIdEmpty]
            },
            [TableFields.senderName] : {
                type : String,
                required : true,
                required : [ true, ValidationMsgs.SenderNameEmpty]
            },
        },
        [TableFields.message] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.MessageEmpty],
        },
        [TableFields.messageType] : {
            type : Number,
            enum : Object.values(MessageTypes),
            required : [true, ValidationMsgs.MessageTypeEmpty],
        },
        [TableFields.deleteForEveryone] : {
            type : Boolean,
            default : false
        },
        [TableFields.isEdited] : {
            type : Boolean,
            default : false
        },
        [TableFields.deleteForMe] : [
            {
                [TableFields.userId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.User
                }
            }
        ],
        [TableFields.receivedBy] : [
            {
                [TableFields.ID] : false,
                [TableFields.userId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.User
                }
            }
        ],
        [TableFields.seenBy] : [
            {
                [TableFields.ID] : false,
                [TableFields.userId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.User
                }
            }
        ],
        [TableFields.reaction] : {
            type : Number,
            enum : Object
        },
    },
    {
        timestamps : true,
        toJSON : {
            transform : function (doc, ret) {
                delete ret[TableFields.tokens];
                delete ret[TableFields.password];
                delete ret.createdAt;
                delete ret.updatedAt;
                if (ret.hasOwnProperty([TableFields.profilePicture])) {
                    ret[TableFields.profilePicture] = getUrl(Folders.profilePicture, ret[TableFields.profilePicture]);
                }
                delete ret.__v;
            }
        }
    }
);

const message = mongoose.model(TableNames.Message, messageSchema);
module.exports = message;