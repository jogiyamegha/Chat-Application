const mongoose = require('mongoose');
const {MessageTypes, TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');

const groupMessageSchema = new mongoose.Schema(
    {
        [TableFields.chatGroupId] : {
            type : mongoose.Types.ObjectId,
            ref : TableNames.User,
            required : [true, ValidationMsgs.ChatGroupIdEmpty],
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
        [TableFields.seenBy] : [
            {
                [TableFields.ID] : false,
                [TableFields.userId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.User
                }
            }
        ],
        [TableFields.deleted] : {
            type : Boolean,
            default : false
        }         
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

const GroupMessage = mongoose.model(TableNames.GroupMessage, groupMessageSchema);
module.exports = GroupMessage;