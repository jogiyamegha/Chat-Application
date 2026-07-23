const SocketUsersController = require('./controllers/SocketUsers/socketUsersController');
const ChatRoomController = require('./controllers/ChatRoom/chatRoomController');
const UserController = require('./controllers/User/userController');
const MessageController = require('./controllers/Message/messageController');
const UserService = require('./db/services/userService');
const { verifySocketToken } = require('./middlewares/socketAuth');
const { TableFields, ValidationMsgs } = require('./utils/constants');
const ValidationError = require('./utils/ValidationError');
const SocketUsersService = require('./db/services/socketUsersService');
const ChatRoomService = require('./db/services/chatRoomService');
const MessageService = require('./db/services/messageService');

module.exports = function (io) {
    io.on('connection', async (socket) => {
        const { decoded, error } = await verifySocketToken(socket);
        if (error) {
            socket.emit('authError', { success: false, error });
            return;
        }

        try {
            const userId = decoded[TableFields.ID];
            SocketUsersController.updateSocketId(socket.id, userId);
        } catch (err) {
            console.error('[connection] error:', err);
            return socket.emit('authError', { success: false, error: 'Failed to connect' });
        }

        console.log(`Socket ${socket.id} connected!`);

        socket.on('createConnection', async (ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketId = socket.id;

                console.log("userId");

                await SocketUsersController.createSocketUser(userId, socketId);
                return ack({ success: true, message: 'Connected successfully!' });
            } catch (err) {
                console.error('[createConnection] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on ('getAllUsers', async (ack) => {
            try {
                const allUsers = await UserController.getAllUsers()
                return ack({success : true, users : allUsers});
            } catch (error) {
                console.log(error);
                return ack({ success: false})
            }
        })

        socket.on('getAllChatrooms', async (ack) => {
            try {
                const userId = decoded[TableFields.ID];

                const chatRooms = await ChatRoomController.getAllChatrooms(userId); 
                // return chatRooms
                return ack({ success: true, chatRooms }); 
            } catch (err) {
                console.error('[getAllChatrooms] error:', err);
                return ack({ success: false, error: err.message });
            }
        })

        socket.on('onlineStatusChange', async (ack = () => { }) => {
            try {
                const { decoded, error } = await verifySocketToken(socket);
                if (error) {
                    socket.emit('authError', { success: false, error });
                    return ack({ success: false, error: 'Auth failed' });
                }

                const senderId = decoded[TableFields.ID];
                await SocketUsersController.updateOnlineStatus(senderId);

                return ack({ success: true, message: 'You are online now...' });
            } catch (err) {
                console.error('[onlineStatusChange] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('createChatRoom', async ({ isGroup, receiverId, groupName, description, participants = [] }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();

                if (!socketUser[TableFields.isOnline]) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const user = await UserService.getUserById(userId).withId().execute();
                if (!user) throw new ValidationError(ValidationMsgs.UserNotFound);

                let participantIds = Array.isArray(participants) ? participants : [participants];
                if (!participantIds.includes(userId)) {
                    participantIds.unshift(userId);
                }

                const req = { body: { isGroup, receiverId, groupName, description, participants: participantIds } };
                const group = await ChatRoomController.createChatRoom(userId, req);

                if (group) {
                    await ChatRoomController.updateParticipantsCount(group);
                }

                return ack({ success: true, message: 'chat room created successfully' });
            } catch (err) {
                console.error('[createChatRoom] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('addParticipants', async ({ chatRoomId, participants = [] }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();

                if (!socketUser[TableFields.isOnline]) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];
                const userIsAdmin = await ChatRoomService.checkUserIsAdmin(chatRoomId, userId);

                if (!isGroup) {
                    return socket.emit('NotGroup', 'Opps, it is not group so can not add participants');
                }

                if (!userIsAdmin) {
                    return socket.emit('unAuthorized', 'You are not eligible to add participants');
                }

                const req = { body: { chatRoomId, participants } };
                await ChatRoomController.addParticipantsToGroup(chatRoomId, req);

                return socket.emit('additionSuccess', `participants added successfully!`);
            } catch (err) {
                console.error('[addParticipants] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('joinGroup', async ({ chatRoomId }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
                const isOnline = socketUser[TableFields.isOnline];

                if (!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                if (isGroup) {
                    const isGroupMember = await ChatRoomController.checkGroupMemberOrNot(chatRoomId, userId);
                    if (isGroupMember) {
                        return socket.emit('groupMember', 'You already exists in group!');
                    }

                    const req = { body: { chatRoomId } };
                    await ChatRoomController.joinToGroup(req, userId);

                    return socket.emit('joinGroupSuccess', 'Group joined successfully!');
                }
            } catch (err) {
                console.error('[joinGroup] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('removeParticipants', async ({ chatRoomId, participants }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
                const isOnline = socketUser[TableFields.isOnline];

                if (!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                if (isGroup) {
                    const userIsAdmin = await ChatRoomService.checkUserIsAdmin(chatRoomId, userId);
                    if (!userIsAdmin) {
                        return socket.emit('unAuthorized', 'You are not eligible to remove participants');
                    }

                    const req = { body: { chatRoomId, participants } };
                    await UserController.removeParticipantsFromGroup(req);

                    return socket.emit('removeSuccess', `participants removed successfully!`);
                }
            } catch (err) {
                console.error('[removeParticipants] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('rejoinGroup', async( {chatGroupId} ) => {
            const userId = decoded[TableFields.ID];

            const req = {
                body : {
                    chatGroupId
                }
            }
            await ChatRoomController.rejoinMember( userId, req )
        }) 

        socket.on('sendMessage', async ({ chatRoomId, message, messageType }, ack = () => { }) => {
            try {
                const senderId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(senderId).withBasicInfo().execute();
                const isOnline = socketUser[TableFields.isOnline];

                if (!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const isParticipant = await ChatRoomService.checkIsParticipant(chatRoomId, senderId);
                if (!isParticipant) {
                    return socket.emit('unAuthorized', 'sorry You are not member of this group, so can not send message!');
                }

                const req = { body: { chatRoomId, message, messageType } };
                const msg = await MessageController.sendMessage(senderId, req);
                await ChatRoomController.updateLastMessage(msg, chatRoomId, senderId, req);

                const groupMembers = await ChatRoomController.getGroupMembers(chatRoomId);

                for (let i = 0; i < groupMembers.length; i++) {
                    const isOnline = await SocketUsersController.checkOnlineUser(groupMembers[i][TableFields.userId]);
                    if (isOnline === true) {
                        const socketId = await SocketUsersController.getSocketId(groupMembers[i][TableFields.userId]);
                        if (socketId) {
                            socket.to(socketId).emit('messageReceived', { message });
                        }
                    }
                }

                return ack({ success: true, message: 'Message sent successfully', data: message });
            } catch (err) {
                console.error('[sendMessage] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('editMessage', async({messageId, msg}, ack = () => {}) => {
            const userId = await decoded[TableFields.ID];

            const isMyMsg = await MessageService.checkIsMyMessage(userId, messageId);
            if(isMyMsg == null) {
                return socket.emit('notYourMessage', 'You can not edit this message as not your message');
            }

            const req = {
                body : {
                    messageId, 
                    msg
                }
            }

            return await MessageController.editMessage(req);
        })

        socket.on('deleteMessageForEveryone', async( {messageId, msg}, ack = () => {}) => {
            const userId = await decoded[TableFields.ID];

            const isMyMsg = await MessageService.checkIsMyMessage(userId, messageId);
            if(isMyMsg == null) {
                return socket.emit('notYourMessage', 'You can not Delete this message as not your message');
            }
            const req = {
                body : {
                    messageId, 
                    msg
                }
            }

            return await MessageController.deleteMessageForEveryone(req);
        })

        socket.on('deleteMessageForMe', async ( { messageId }, ack = () => {}) => {
            const userId = await decoded[TableFields.ID];

            const req = {
                body  : {
                    messageId
                }
            }
            return await MessageController.deleteMessageForMe(req, userId);
        })

        socket.on('makeOtherParticipantAdmin', async ({ chatRoomId, participantId }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const user = await UserService.getUserById(userId).withBasicInfo().execute();
                const isOnline = await SocketUsersController.checkOnlineUser(userId);

                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                if (!isGroup) {
                    return socket.emit('NotGroup', 'it is not a group');
                }

                if (!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const req = { body: { chatRoomId, participantId } };
                await ChatRoomController.makeOtherParticipantToAdmin(userId, req);

                return socket.emit('OtherParticipantMakeAdminSuccess', `${user[TableFields.name_]} is also Admin Now!`);
            } catch (err) {
                console.error('[makeOtherParticipantAdmin] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('showChatRoomMessage', async ({ chatRoomId }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const isParticipant = await ChatRoomService.checkIsParticipant(chatRoomId, userId);

                if (!isParticipant) {
                    return socket.emit('NotParticipant', 'You are not participant to show message');
                }

                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                if (!isGroup) {
                    let chat = [];
                    if (chatRoom[TableFields.clearChat] && chatRoom[TableFields.clearChatAt]) {
                        chat = await MessageService.getChatHistory(chatRoom);
                    } else {
                        chat = await MessageService.getChatHistory(chatRoom);
                    }

                    return socket.emit('chatHistory', chat);
                } else {
                    const chatForMe = await MessageService.getChatHistoryForMe(chatRoom, userId);
                    return socket.emit('chatHistory', chatForMe);
                }
            
            } catch (err) {
                console.error('[showChatRoomMessage] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('clearChat', async ({ chatRoomId }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                if (!isGroup) {
                    await ChatRoomService.updateClearChat(chatRoomId);
                } else {
                    await ChatRoomService.updateClearChatForMe(chatRoomId, userId);
                }

                return ack({ success: true, message: 'Chat cleared successfully' });
            } catch (err) {
                console.error('[clearChat] error:', err);
                return ack({ success: false, error: err.message });
            }
        });

        socket.on('exitGroup', async ({ chatGroupId }, ack = () => { }) => {
            try {
                const userId = decoded[TableFields.ID];
                const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
                const isOnline = socketUser[TableFields.isOnline];

                if (!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!');
                }

                const isGroupMember = await ChatRoomController.checkGroupMemberOrNot(chatGroupId, userId);
                if (!isGroupMember) {
                    return socket.emit('unAuthorized', 'failed');
                }

                const req = { body: { chatGroupId } };
                await ChatRoomController.exitFromGroup(req, userId);

                return ack({ success: true, message: 'Exited from group successfully' });
            } catch (err) {
                console.error('[exitGroup] error:', err);
                return ack({ success: false, error: err.message });
            }
        });
    });
};
