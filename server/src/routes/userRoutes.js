const API = require('../utils/apiBuilder');
const AuthController = require('../controllers/User/authController');
const UserController = require('../controllers/User/userController');
const ChatRoomController = require('../controllers/ChatRoom/chatRoomController');
const { TableFields } = require('../utils/constants');
const ImageHandler = require('../middlewares/imageVerifier');
const router = API.configRoute('/user')

/**
 * -------------------------------
 * Auth Routes 
 * -------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addUser)
.userMiddlewares(ImageHandler.single([TableFields.profilePicture]))
.build()

.addPath('/login')
.asPOST(AuthController.login)
.build()

.addPath('/logout')
.asPOST(AuthController.logout)
.useUserAuth()
.build()

.addPath('/setGroupProfilePicture')
.asPOST(UserController.setGroupProfile)
.useUserAuth()
.userMiddlewares(ImageHandler.single([TableFields.image]))
.build()


.addPath('/all-chat-rooms')
.asGET(ChatRoomController.getAllChatrooms)
.useUserAuth()
.build()

.getRouter()
module.exports = router;