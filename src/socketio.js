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
        //         const senderId = decoded[TableFields.ID];


        //         const req = {
        //             body : { senderName, receiverId, receiverName, chatType, message }
        //         }

        //         const socketUser = await SocketUsersService.getSocketUserById(senderId).withBasicInfo().execute();
        //         const isOnline = socketUser[TableFields.isOnline];

        //         if(!isOnline) {
        //             return socket.emit('onlineErr', 'Please get Online!')
        //         } else {
                    
        //         }

        //         // const roomId = [ senderId, receiverId ].sort().join('-');
        //         // socket.join(roomId);
        //         // console.log('roomId: : :', roomId);
                
        //         // await ChatMsgController.sendMessage(req, senderId);

        //         // const msgToNum = encodeToNumbers(message);
        //         // const numToMsg = decodeFromNumbers(msgToNum)

        //         // socket.to(roomId).emit('messageReceived', { roomId, senderId, senderName, receiverId, receiverName, chatType, message : numToMsg  })
        //         // // socket.emit('sendUserMessage', {"success" : true, "message" : "Message sent successfully!"});
        //         // ack({
        //         //     'acknowledgment': 'Message sent successfully',
        //         //     'success' : true, 
        //         //     message: msgToNum
        //         // })
            
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
                ack({success : true, message : 'You are online now...'})

            } catch (error) {
                throw error;
            }
        })

        socket.on('createChatRoom', async( { isGroup, receiverId, groupName, description, participants = [] },ack = () => {} ) => {
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
                            isGroup, receiverId, groupName, description, participants : participantIds
                        }
                    }
    
                    const group = await ChatRoomController.createChatRoom(userId, req);
                    
                    ack({success : true, message : `chat room created successfully`})
    
                    if(group) {
                        await ChatRoomController.updateParticipantsCount(group);
                    }
                }

            } catch (error) {
                throw error;
            }
        })

        socket.on('addParticipants', async ( { chatRoomId, participants = [] } ) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const req = {
                    body : { chatRoomId, participants }
                }
    
                const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
                const isGroup = chatRoom[TableFields.isGroup];

                const userIsAdmin = await ChatRoomService.checkUserIsAdmin(chatRoomId ,userId);    

                if(!isGroup) { 
                    return socket.emit('NotGroup', "Opps, it is not group so can not add participants")
                } else {

                    if(!userIsAdmin) {
                        socket.emit('unAuthorized', 'You are not eligible to add participants')
                    } else {
                        await ChatRoomController.addParticipantsToGroup(chatRoomId, req);
                        socket.emit('additionSuccess', `participants added successfully!`);
                    }
                }
            }
        })

        socket.on('joinGroup', async ({ chatRoomId }) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
            const isGroup = chatRoom[TableFields.isGroup]

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } 
            
            if(isGroup){
                const isGroupMember = await ChatRoomController.checkGroupMemberOrNot(chatRoomId, userId);
                
                if(isGroupMember) {
                    return socket.emit('groupMember', 'You already exists in group!');
                }

                const req = {
                    body : { chatRoomId }
                }

                await ChatRoomController.joinToGroup(req, userId);
                socket.emit('joinGroupSuccess', 'Group joined successfully!');
            }
        })

        socket.on('removeParticipants', async ({ chatRoomId, participants }) => {
            const userId = decoded[TableFields.ID];
            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
            const isGroup = chatRoom[TableFields.isGroup];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } 
            
            if(isGroup) {
                const req = {
                    body : { chatRoomId, participants }
                }
    
                const userIsAdmin = await ChatRoomService.checkUserIsAdmin(chatRoomId ,userId);    

                if(!userIsAdmin) {
                    socket.emit('unAuthorized', 'You are not eligible to remove participants');
                } else {
                    await UserController.removeParticipantsFromGroup(req);
                    
                    socket.emit('removeSuccess', `participants removed successfully!`);
                }
            }
        })

        socket.on('sendMessage', async({ chatRoomId, message, messageType }, { ack = () => {} }) => {
            const senderId = decoded[TableFields.ID];

            const socketUser = await SocketUsersService.getSocketUserById(senderId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const isParticipant = await ChatRoomService.checkIsParticipantOrNot(chatRoomId, senderId);
                console.log("isParticipant", isParticipant);
                if(!isParticipant) {
                    return socket.emit('unAuthorized', 'sorry You are not member of this group, so can not send message!')
                }
                
                const req = {
                    body : { chatRoomId, message, messageType }
                }
                const msg = await MessageController.sendMessage(senderId, req);
                // await MessageController.updateSeenBy(senderId, chatGroupId);
                await ChatRoomController.updateLastMessage(msg, chatRoomId ,senderId, req);
    
                // /***** For receiving message *******/

                const groupMembers = await ChatRoomController.getGroupMembers(chatRoomId);
                
                let onlineUsers = [];
    
                for(let i = 0; i < groupMembers.length; i++){
                    const isOnline = await SocketUsersController.checkOnlineUser(groupMembers[i][TableFields.userId])
                    console.log(isOnline);
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
        //     await ChatRoomController.rejoinMember( userId, req )
        // }) 

        socket.on('makeOtherParticipantAdmin', async ({ chatRoomId, participantId}) => {
            const userId = decoded[TableFields.ID];
            const user = await UserService.getUserById(userId).withBasicInfo().execute();
            const isOnline = await SocketUsersController.checkOnlineUser(userId);

            const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();

            const isGroup = chatRoom[TableFields.isGroup];

            if(!isGroup) {
                return socket.emit('NotGroup', "it is not a group")
            } else {
                if(!isOnline) {
                    return socket.emit('onlineErr', 'Please get Online!')
                } else {
                    const req = {
                        body : { chatRoomId, participantId }
                    }
                    await ChatRoomController.makeOtherParticipantToAdmin(userId, req);
                    return socket.emit('OtherParticipantMakeAdminSuccess', `${user[TableFields.name_]} is also Admin Now!`)
                }
            }

        })

        socket.on('showChatRoomMessage', async({ chatRoomId }) => {
            const userId = decoded[TableFields.ID];

            const isParticipant = await ChatRoomService.checkIsParticipant(chatRoomId, userId);
            if(!isParticipant) {
                return socket.emit('NotParticipant', 'You are not participant to show message');
            }

            console.log(isParticipant);
            const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
            const isGroup = chatRoom[TableFields.isGroup];

            if(!isGroup) {
                const chat = await MessageService.getChatHistory(chatRoomId);
                console.log(chat);
                return socket.emit('chatHistory', chat)
            }

            // const isOnline = await SocketUsersController.checkOnlineUser(userId);

            // if(!isOnline) {
            //     return socket.emit('onlineErr', 'Please get Online!')
            // } else {
            //     const isGroupMember = await ChatRoomController.checkGroupMemberOrNot(chatRoomId, userId);
            //     const isPastMember = await ChatRoomController.checkIsPastMember(chatRoomId, userId);
            //     console.log('isPastMember',isPastMember);
            //     if(isGroupMember == false && isPastMember == false) {
            //         return socket.emit('unAuthorized', 'Ops, sorry You can not read message!')
            //     }
                
            //     const req = {
            //         body : { chatRoomId }
            //     }

            //     const limit = socket.handshake.query.limit;
            //     const skip = socket.handshake.query.skip;

            //     const chat = await MessageController.showMessage(userId, req, limit, skip);

            //     socket.emit('chatHistory', chat );
            // }
        })

        socket.on('clearChat', async ({chatRoomId}) => {
            const userId = decoded[TableFields.ID];

            const chatRoom = await ChatRoomService.getChatRoomById(chatRoomId).withBasicInfo().execute();
            const isGroup = chatRoom[TableFields.isGroup];

            if(!isGroup) {
                
            }

        })

        socket.on('exitGroup', async ( { chatGroupId } ) => {
            const userId = decoded[TableFields.ID];

            const socketUser = await SocketUsersService.getSocketUserById(userId).withBasicInfo().execute();
            const isOnline = socketUser[TableFields.isOnline];

            if(!isOnline) {
                return socket.emit('onlineErr', 'Please get Online!')
            } else {
                const isGroupMember = await ChatRoomController.checkGroupMemberOrNot(chatGroupId, userId);
                if(!isGroupMember) {
                    return socket.emit('unAuthorized', 'failed')
                } else {

                    const req = {
                        body : { chatGroupId }
                    };
                    
                    await ChatRoomController.exitFromGroup(req, userId)
                } 
            }
        })
    })
}