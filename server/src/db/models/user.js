const mongoose = require('mongoose');
const validator = require('validator');
const { TableFields, TableNames, ValidationMsgs } = require('../../utils/constants');
const {getUrl, Folders} = require("../../utils/storage")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        [TableFields.name_] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.NameEmpty],
        },
        [TableFields.email] : {
            type : String,
            trim : true,
            lowercase : true,
            required : [ true, ValidationMsgs.EmailEmpty],
            validate(value) {
                if(!validator.isEmail(value)) {
                    throw new ValidationError(ValidationMsgs.EmailInvalid)
                }
            }
        },
        [TableFields.password] : {
            type : String, 
            minLength : 5,
            trim : true,
            required : [ true, ValidationMsgs.PasswordInvalid],
        },
        [TableFields.tokens] : [
            {
                [TableFields.ID] : false,
                [TableFields.token] : {
                    type : String,
                }
            }
        ],
        [TableFields.leftAt] : {
            type : Date
        },
        [TableFields.profilePicture] : {
            type : String, 
            required : [ true, ValidationMsgs.ProfilePictureEmpty],
        },
         [TableFields.active] : {
            type : Boolean,
            default : true,
            required : [ true, ValidationMsgs.ActiveEmpty]
        },
        [TableFields.isAdmin] : {
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

userSchema.methods.isValidAuth = async function (password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.isValidPassword = function (password) {
    const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regEx.test(password);
}

userSchema.methods.createAuthToken = function() {
    const token = jwt.sign(
        {
            [TableFields.ID] : this[TableFields.ID].toString(),
        },
        process.env.JWT_USER_PK,
        {
            expiresIn : '24h'
        }
    );
    return token;
}

userSchema.pre("save", async function (next) {
    if( this.isModified(TableFields.password)){
        this[TableFields.password] = await bcrypt.hash(this[TableFields.password], 8);
    }
    next();
})

const User = mongoose.model(TableNames.User, userSchema);
module.exports = User;
