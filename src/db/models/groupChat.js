const mongoose = require('mongoose');
const { TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');
const {getUrl, Folders} = require("../../utils/storage");

const groupChatSchema = new mongoose.Schema(
    {
        [TableFields.createdBy] : {
            type : mongoose.Types.ObjectId,
            ref : TableNames.User,
            required : [true, ValidationMsgs.CreatedByEmpty],
        },
        [TableFields.groupName] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.GroupNameEmpty],
        },
        [TableFields.description] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.DescriptionEmpty]
        },
        [TableFields.profilePicture] : {
            type : String, 
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
                    default : Date.now()
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
                ref : TableNames.GroupMessage
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
            }
        },
        [TableFields.removedParticipants] : [
            {
                [TableFields.participantId] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.GroupChat
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
        ]
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

const GroupChat = mongoose.model(TableNames.GroupChat, groupChatSchema);
module.exports = GroupChat;