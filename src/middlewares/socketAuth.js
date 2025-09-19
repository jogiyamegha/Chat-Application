const jwt = require("jsonwebtoken");
const { ValidationMsgs, TableFields } = require("../utils/constants");
const SocketUsersService = require('../db/services/socketUsersService');
 
exports.verifySocketToken = async (socket) => {
    const token = socket.handshake.query.token;
    if (!token) {
        return { error: "Token missing" };
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_USER_PK);
        // console.log(decoded);
        // console.log(decoded[TableFields.ID]);
        return { decoded };
    } catch (err) {
        return { error: ValidationMsgs.AuthFail };
    }
};