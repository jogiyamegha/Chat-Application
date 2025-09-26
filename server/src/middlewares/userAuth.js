const jwt = require("jsonwebtoken");
const { ValidationMsgs, TableFields, TableNames, InterfaceTypes, ResponseStatus, AuthTypes, UserTypes} = require("../utils/constants")
const Util = require("../utils/util");
const ValidationError = require("../utils/ValidationError");
const UserService = require("../db/services/userService");

const auth = async (req, res, next) => {
    try {
        const headerToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(headerToken, process.env.JWT_USER_PK);
        const user = await UserService.getUserByIdAndToken(decoded[TableFields.ID], headerToken)
        .withBasicInfo()
        .execute();

        if(!user) {
            throw new ValidationError();
        }

        req.user = user;
                
        next();
        
    } catch (e) {
        if( !(e instanceof ValidationError)){
            console.log(e);
        }
        //Error due to :
        // - No token in header OR
        // - Token not exists in the database
        res.status(ResponseStatus.Unauthorized).send(Util.getErrorMessageFromString(ValidationMsgs.AuthFail));
    }
};
module.exports = auth;