const UserService = require('../../db/services/userService');
const {InterfaceTypes, TableFields, ValidationMsgs } = require('../../utils/constants')
const ValidationError = require('../../utils/ValidationError');
const {addFile, removeFileById} = require("../../utils/storage");
const {Folders} = require("../../utils/metadata");
const { MongoUtil } = require('../../db/mongoose');

exports.addUser = async (req) => {
    let providedFile = req.file || null;
    let reqBody = req.body;

    const createdUserRecords = await parseAndValidateUser(
        providedFile,
        reqBody,
        undefined,
        async (updatedUserFields) => {
            const existingUser = await UserService.findByEmail(updatedUserFields[TableFields.email]).execute();
            if (existingUser) {
                throw new ValidationError(ValidationMsgs.UserExists);
            }
            const { createdUserRecords } = await UserService.insertRecord(updatedUserFields);
            return createdUserRecords;
        }
    );

    const user = await UserService.findByEmail(reqBody[TableFields.email])
        .withPassword()
        .withBasicInfo()
        .execute();
    
    const token = user.createAuthToken(InterfaceTypes.User.UserWeb);
    await UserService.saveAuthToken(user[TableFields.ID], token);

    return { user, token };
};

exports.login = async (req) => {
    let email = req.body[TableFields.email];
    if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
    email = (email + '').trim().toLowerCase();

    const password = req.body[TableFields.password];
    if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);


    let user = await UserService.findByEmail(email)
    .withPassword()
    .withBasicInfo()
    .execute();
    
    if(user && user[TableFields.deleted] == true) {
        throw new ValidationError(ValidationMsgs.UserIsDeleted)
    }
    
    if(user && (await user.isValidAuth(password)) && user[TableFields.active]){
        const token = user.createAuthToken(InterfaceTypes.User.UserWeb);
        await UserService.saveAuthToken(user[TableFields.ID], token);
        console.log('Login Successfully!');
        return { user, token: token};
    } else throw new ValidationError(ValidationMsgs.UnableToLogin);
}

exports.logout = async(req) => {
    const headerToken = req.header('Authorization').replace('Bearer ', '');
    UserService.removeAuth(req.user[TableFields.ID], headerToken);
}

async function parseAndValidateUser(
    providedFile,
    reqBody,
    existingUser = {},
    onValidationCompleted = async () => {}
) {
    const id = MongoUtil.newObjectId();

    if (isFieldEmpty(reqBody[TableFields.name_], existingUser[TableFields.name_])) {
        throw new ValidationError(ValidationMsgs.NameEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.email], existingUser[TableFields.email])) {
        throw new ValidationError(ValidationMsgs.EmailEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.password], existingUser[TableFields.password])) {
        throw new ValidationError(ValidationMsgs.PasswordEmpty);
    }

    let persistedImageKey = null;
    if (providedFile) {
        try {
            persistedImageKey = await addFile(
                Folders.profilePicture,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
        } catch (uploadError) {
            throw new Error("Failed to upload profile picture.");
        }
    }

    const email = (reqBody[TableFields.email] + '').trim().toLowerCase();

    const response = await onValidationCompleted({
        [TableFields.profilePicture]: persistedImageKey,
        [TableFields.name_]: reqBody[TableFields.name_],
        [TableFields.email]: email,
        [TableFields.password]: reqBody[TableFields.password]
    });

    return response;
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        return false;
    } else if (existingField) {
        return false;
    }
    return true;
}
