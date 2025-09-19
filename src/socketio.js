const SocketUsersController = require('./controllers/SocketUsers/socketUsersController');
const GroupChatController = require('./controllers/GroupChat/groupChatController');
const UserController = require('./controllers/User/userController');
const GroupMessageController = require('./controllers/GroupMessage/groupMessageController');
const UserService = require('./db/services/userService');
const { verifySocketToken } = require('./middlewares/socketAuth');
const { TableFields, ValidationMsgs } = require('./utils/constants');
const ValidationError = require('./utils/ValidationError');
const SocketUsersService = require('./db/services/socketUsersService');


module.exports = function (io) {
    io.on('connection', async (socket) => {
        const { decoded, error } = await verifySocketToken(socket);
        if(error) {
            return socket.emit('authError', { message : error });
        } 
        try {
            const userId = decoded[TableFields.ID];
            SocketUsersController.updateSocketId(socket.id, userId);
        }catch(error) {
            throw error
        }


        socket.on('createConnection', async( ack = () => {} ) => {
            try{
                const userId = decoded[TableFields.ID];
                const socketId = socket.id;
    
                await SocketUsersController.createSocketUser(userId, socketId);
    
                socket.emit('connectionSuccess', `Connected successfully!`);
            } catch (error) {
                throw error;
            }
        })

        console.log(`Socket ${socket.id} connected!`);

        // socket.on('sendPersonalMessage', async ({ receiverId, chatType , message }, ack =() => {}) => {
        //     try {
        //         const { decoded, error } = verifySocketToken(socket)
                
        //         if(error) {
        //             socket.emit('authError', { message : error });
        //             console.log('Authentication Failed!');
        //             return ack({success : false, error : "Auth_failed"});
        //         }

        //         const senderId = decoded[TableFields.ID];

        //         const req = {
        //             body : { senderName, receiverId, receiverName, chatType, message }
        //         }

        //         const roomId = [ senderId, receiverId ].sort().join('-');
        //         socket.join(roomId);
        //         console.log('roomId: : :', roomId);
                
        //         await ChatMsgController.sendMessage(req, senderId);

        //         const msgToNum = encodeToNumbers(message);
        //         const numToMsg = decodeFromNumbers(msgToNum)

        //         socket.to(roomId).emit('messageReceived', { roomId, senderId, senderName, receiverId, receiverName, chatType, message : numToMsg  })
        //         // socket.emit('sendUserMessage', {"success" : true, "message" : "Message sent successfully!"});
        //         ack({
        //             'acknowledgment': 'Message sent successfully',
        //             'success' : true, 
        //             message: msgToNum
        //         })
            
        //     } catch (error) {
        //         throw error
        //     }           
        // });

        socket.on('onlineStatusChange', async ({ ack = () => {} }) => {
            try {
                const { decoded, error } = await verifySocketToken(socket);
                if(error) {
                    socket.emit('authError', { message : error });
                    return ack({success : false, error : "Auth failed"});
                }

                const senderId = decoded[TableFields.ID];
                
                await SocketUsersController.updateOnlineStatus(senderId);
                ack({
                    'acknowledgement' : 'You are online now, can start conversation'
                })

            } catch (error) {
                throw error;
            }
        })

        socket.on('createGroup', async( { groupName, description, participants = [] },ack = () => {} ) => {
            try{
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
                const isOnline = socketUser[TableFields.isOnline];

                if(!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!')
                } else {
                    if(userId) {
                        const user = await UserService.getUserById(userId).withId().execute();
                        if(!user) {
                            throw new ValidationError(ValidationMsgs.UserNotFound)
                        }
                    }
                    
                    let participantIds = Array.isArray(participants) ?  participants : [participants];
                    if(!participantIds.includes(userId)) {
                        participantIds.unshift(userId)
                    }
    
                    const req = {
                        body : {
                            groupName, description, participants : participantIds
                        }
                    }
    
                    const group = await GroupChatController.createGroup(userId, req);
                    
                    ack({success : true, message : `Group created successfully`})
    
                    if(group) {
                        await GroupChatController.updateParticipantsCount(group);
                    }
                }

            } catch (error) {
                throw error;
            }
        })

        socket.on('addParticipants', async ( { groupId, participants = [] } ) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const req = {
                    body : { groupId, participants }
                }
    
                const user = await UserService.getUserById(userId).withBasicInfo().withId().execute();
                if(!user) {
                    throw new ValidationError(ValidationMsgs.UserNotFound);
                }
    
                const isAdmin = user[TableFields.isAdmin];
                console.log("user", user);

                if(!isAdmin) {
                    socket.emit('unAuthorized', 'You are not eligible to add participants')
                } else {
                    await UserController.addParticipantsToGroup(req);
                    socket.emit('additionSuccess', `participants added successfully!`);
                }
            }
        })

        socket.on('joinGroup', async ({ chatGroupId }) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const isGroupMember = await GroupChatController.checkGroupMemberOrNot(chatGroupId, userId);
                
                if(isGroupMember) {
                    return socket.emit('groupMember', 'You already exists in group!');
                }

                const req = {
                    body : { chatGroupId }
                }

                await GroupChatController.joinToGroup(req, userId);
                socket.emit('joinGroupSuccess', 'Group joined successfully!');
            }
        })

        socket.on('removeParticipants', async ({ groupId, participants }) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];
            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const req = {
                    body : { groupId, participants }
                }
    
                const user = await UserService.getUserById(userId).withBasicInfo().withId().execute();
                if(!user) {
                    throw new ValidationError(ValidationMsgs.UserNotFound);
                }
    
                const isAdmin = user[TableFields.isAdmin];
                if(!isAdmin) {
                    socket.emit('unAuthorized', 'You are not eligible to add participants');
                } else {
                    await UserController.removeParticipantsFromGroup(req);
                    
                    socket.emit('removeSuccess', `participants removed successfully!`);
                }
            }
        })

        socket.on('sendMessage', async({ chatGroupId, message, messageType }, { ack = () => {} }) => {
            const senderId = decoded[TableFields.ID];

            const socketUser = await SocketUsersService.getSocketUserById(senderId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {

                const isGroupMember = await GroupChatController.checkGroupMemberOrNot(chatGroupId, senderId);
                if(!isGroupMember) {
                    return socket.emit('unAuthorized', 'sorry You are not member of this group, so can not send message!')
                }
                
                const req = {
                    body : { chatGroupId, message, messageType }
                }
                const msg = await GroupMessageController.sendMessage(senderId, req);
                await GroupMessageController.updateSeenBy(senderId, chatGroupId);
                await GroupChatController.updateLastMessage(msg, chatGroupId ,senderId, req);
    
                /***** For receiving message *******/

                const groupMembers = await GroupChatController.getGroupMembers(chatGroupId);
                
                let onlineUsers = [];
    
                for(let i = 0; i < groupMembers.length; i++){
                    const isOnline = await SocketUsersController.checkOnlineUser(groupMembers[i][TableFields.userId])
                    if(isOnline === true) {
                        const socketId = await SocketUsersController.getSocketId(groupMembers[i][TableFields.userId]);
                        if (socketId) {
                            socket.to(socketId).emit('messageReceived', { message });
                        }
                    }
                }
                socket.join(onlineUsers);
                io.to(onlineUsers).emit('messageReceived', {message : message})
                
                ack({
                    'acknowledgment': 'Message sent successfully',
                    'success' : true, 
                    message: message
                })
            }
        })

        // socket.on('rejoinGroup', async( {chatGroupId} ) => {
        //     const userId = decoded[TableFields.ID];

        //     const req = {
        //         body : {
        //             chatGroupId
        //         }
        //     }
        //     await GroupChatController.rejoinMember( userId, req )
        // }) 

        socket.on('makeOtherParticipantAdmin', async ({ chatGroupId, participantId}) => {
            const userId = decoded[TableFields.ID];
            const isOnline = await SocketUsersController.checkOnlineUser(userId);

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const req = {
                    body : { chatGroupId, participantId }
                }
                await GroupChatController.makeOtherParticipantToAdmin(userId, req);
            }
        })

        socket.on('showGroupMessage', async({ chatGroupId }) => {
            const userId = decoded[TableFields.ID];
            const isOnline = await SocketUsersController.checkOnlineUser(userId);

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const isGroupMember = await GroupChatController.checkGroupMemberOrNot(chatGroupId, userId);
                const isPastMember = await GroupChatController.checkIsPastMember(chatGroupId, userId);
                console.log('isPastMember',isPastMember);
                if(isGroupMember == false && isPastMember == false) {
                    return socket.emit('unAuthorized', 'Ops, sorry You can not read message!')
                }
                
                const req = {
                    body : { chatGroupId }
                }

                const limit = socket.handshake.query.limit;
                const skip = socket.handshake.query.skip;

                const chat = await GroupMessageController.showMessage(userId, req, limit, skip);

                socket.emit('chatHistory', chat );
            }
        })

        socket.on('exitGroup', async ( { chatGroupId } ) => {
            const userId = decoded[TableFields.ID];

            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const isGroupMember = await GroupChatController.checkGroupMemberOrNot(chatGroupId, userId);
                if(!isGroupMember) {
                    return socket.emit('unAuthorized', 'failed')
                } else {

                    const req = {
                        body : { chatGroupId }
                    };
                    
                    await GroupChatController.exitFromGroup(req, userId)
                } 
            }
        })
    })
}