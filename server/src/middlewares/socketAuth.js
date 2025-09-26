const jwt = require("jsonwebtoken");
const { ValidationMsgs } = require("../utils/constants");

exports.verifySocketToken = async (socket) => {
    // Read token from socket.io-client auth object
    const token = socket.handshake.auth?.token;
    if (!token) {
        return { error: "Token missing" };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_USER_PK);
        return { decoded };
    } catch (err) {
        return { error: ValidationMsgs.AuthFail };
    }
};
