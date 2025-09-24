const mongoose = require('mongoose');
const { TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');
const {getUrl, Folders} = require("../../utils/storage");

const chatRoomSchema = new mongoose.Schema(
    {
        [TableFields.isGroup] : {
            type: Boolean,
            default : false,
            required : [true, ValidationMsgs.IsGroupEmpty]
        },
        [TableFields.personalChatRoomDetails] : {
            [TableFields.userId]  : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.User
            },
            [TableFields.receiverId] : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.User
            }
        },
        [TableFields.groupDetails] : {
            [TableFields.groupName] : {
                type : String,
                trim : true
            },
            [TableFields.createdBy] : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.User,
            },
            [TableFields.description] : {
                type : String,
                trim : true,
            },
            [TableFields.profilePicture] : {
                type : String, 
            },
        },
        [TableFields.participants] : [
            {
                [TableFields.ID] : false,
                [TableFields.userId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.User
                },
                [TableFields.name_] : {
                    type : String,
                },
                [TableFields.isAdmin] : {
                    type : Boolean,
                    default : false
                },
                [TableFields.joinedAt] : {
                    type : Date,
                },
            }
        ],
        [TableFields.participantsCount] : {
            type : Number,
            default : 0,
        },
        [TableFields.lastMessage] : {
            [TableFields.lastMsgId] : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.Message
            },
            [TableFields.message] : {
                type : String,
                trim : true
            },
            [TableFields.senderName] : {
                type : String,
                trim : true
            },
            [TableFields.senderId] : {
                type : mongoose.Types.ObjectId,
                ref : TableNames.User
            },
        },
        [TableFields.removedParticipants] : [
            {
                [TableFields.participantId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.ChatRoom
                }, 
                [TableFields.name_] : {
                    type: String,
                    trim : true
                },
                [TableFields.joinedAt] : {
                    type : Date,
                },
                [TableFields.leftAt]: {
                    type : Date, 
                }
            }
        ],
        [TableFields.clearChat] : {
            type: Boolean,
            default: false
        },
        [TableFields.clearChatAt] : {
            type: Date
        }
    },
    {
        timestamps : true,
        toJSON : {
            transform : function (doc, ret) {
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

const chatRoom = mongoose.model(TableNames.ChatRoom, chatRoomSchema);
module.exports = chatRoom;