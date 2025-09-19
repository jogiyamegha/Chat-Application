const {TableFields, ValidationMsgs, UserTypes, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const User = require("../models/user");
const { MongoUtil } = require("../mongoose");
const {removeFileById, Folders} = require("../../utils/storage");

class UserService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne(
                {
                    [TableFields.ID] : userId
                }
            )
        })
    }

    static addJoinedAtToUser = async (groupId, id, value) => {
        await User.findByIdAndUpdate(
            {
                [TableFields.ID] : MongoUtil.toObjectId(id)
            }, 
            {
                $set: {
                    // [TableFields.joinDetails] : {
                    //     [TableFields.chatGroupId] : groupId,
                    //     [TableFields.wasJoinedAt] : value
                    // }
                }
            }
        )
    }

    static addLeftAt = async (userId) => {
        return await User.updateOne(
            { 
                [TableFields.ID]: userId
            },
            {
                $set: {
                    [TableFields.leftAt]: Date.now()
                }
            }
        );
    }

    static updateUserAsAdmin = async (id) => {
        await User.findOneAndUpdate(
            id, 
            {
                [TableFields.isAdmin] : true
            }
        )
    }

    static findByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne({email}, this);
        })
    };

    static recordExists = async (recordId) => {
        return await User.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        })
    }

    static saveAuthToken = async (userId, token) => {
        await User.updateOne(
            {
                [TableFields.ID] : userId
            },
            {
                $push : {
                    [TableFields.tokens] : { 
                        [TableFields.token] : token
                    }
                }
            }
        )
    };

    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static getUserByEmail = (email) => {
        return new ProjectionBuilder(async function() {
            return await User.findOne({[TableFields.email] : email}, this);
        })
    };

    static getUserByIdAndToken = (userId, token, lean = false) => {
        return new ProjectionBuilder(async function() {
            return await User.findOne(
                {
                    [TableFields.ID] : userId,
                    [TableFields.tokens + "." + TableFields.token] : token,
                },
                this
            ).lean(lean);
        });
    };

    static existsWithEmail = async (email, exceptionId) => {
        return await User.exists({
            [TableFields.email] : email,
            ...(exceptionId 
                ? {
                    [TableFields.ID] : {$ne : exceptionId}
                  }
                : {} ),
        });
    };

    static updateUserActiveness = async (recordId, activeStatus) => {
        await User.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.active]: activeStatus,
            }
        )
    }

    static insertRecord = async (updatedUserFields = {}) => {
        var user = new User({
            ...updatedUserFields,
        })
        let error = user.validateSync();
        if(error){
            throw error;
        } else {
            let createdUserRecord = undefined;
            try{
                let createdUserRecord = await user.save();
                return {createdUserRecord};
            } catch (e) {
                if(createdUserRecord) {
                    await createdUserRecord.delete();
                }
                throw e;
            }
        }
    }

    static insertUserRecord = async (reqBody) =>{
        let email = reqBody[TableFields.email];
        email = (email + "").trim().toLocaleLowerCase();
        const password = reqBody[TableFields.password];

        if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
        if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);
        if(email == password) throw new ValidationError(ValidationMsgs.PasswordInvalid);

        if(await UserService.existsWithEmail(email)) throw new ValidationError(ValidationMsgs.DuplicateEmail);

        const user = new User(reqBody);
        // user[TableFields.userType] = UserTypes.User;
        if(!user.isValidPassword(password)){
            throw new ValidationError(ValidationMsgs.PasswordInvalid);
        }
        try {
            await user.save();
            return user;
        } catch (error) {
            if(error.code == 11000){
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.DuplicateEmail);
            }
            throw error;
        }
    }

    static removeAuth = async ( userId, authToken ) => {
        await User.updateOne(
            {
                [TableFields.ID] : userId,
            },
            {
                $pull: {
                    [TableFields.tokens]: {[TableFields.token]: authToken},
                },
            }
        )
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        console.log(cascadeDeleteMethodReference, tableName, ...referenceId);
        switch (tableName) {
            case TableNames.User:
                records = await User.find({
                    [TableFields.ID]: {
                        $in: referenceId,
                    },
                });
                break;
        }
        if (records && records.length > 0) {
            let deleteRecordIds = records.map((a) => a[TableFields.ID]);
            await User.updateMany(
                {
                    [TableFields.ID]: {
                        $in: deleteRecordIds,
                    },
                },
                {
                    $set: {[TableFields.deleted]: true},
                }
            );
            await removeFileById(Folders.profilePicture, records[0].image);

            if (tableName != TableNames.User) {
                //It means that the above objects are deleted on request from model's references (And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall: true,
                    },
                    TableNames.User,
                    ...deleteRecordIds
                ); //So, let's remove references which points to this model
            }
        }
    };
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection =  {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.profilePicture] = 1;
            projection[TableFields.name_] = 1;
            projection[TableFields.email] = 1;
            projection[TableFields.active] = 1;
            projection[TableFields.isAdmin] = 1;
            return this; 
        };
        this.withParticipant = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.name_] = 1;
            projection[TableFields.isAdmin] = 1;
            return this;
        };
        this.withLastMsg = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.message] = 1;
            projection[TableFields.name_] = 1;

            return this;
        }
        this.withDetails = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.name_] = 1;
            return this;
        }
        this.withName = () => {
            projection[TableFields.name_] = 1;
            return this;
        }
        this.withPassword = () =>{
            projection[TableFields.password] = 1;
            return this;
        }
        this.withEmail = () => {
            projection[TableFields.email] = 1;
            return this;
        }
        this.withActiveStatus = () => {
            projection[TableFields.active] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        this.execute = async () => {
            return await methodToExecute.call(projection);
        }

    }
}

module.exports = UserService;
