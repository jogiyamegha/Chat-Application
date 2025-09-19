const MessageTypes = (function() {
    function MessageTypes() {};
    MessageTypes.text = 1;
    MessageTypes.image = 2;
    MessageTypes.link = 3;
    MessageTypes.video = 4;
    MessageTypes.file = 5;
    MessageTypes.audio = 6;

    return MessageTypes;
})();

const InterfaceTypes = (function() {
    function InterfaceTypes() {};
    InterfaceTypes.Admin = {
        AdminWeb : 'i1',
    },
    InterfaceTypes.User = {
        UserWeb : 'i2',
    }

    return InterfaceTypes;
})();

const ResponseStatus = (function () {
    function ResponseStatus() {};
    ResponseStatus.Failed = 0;
    ResponseStatus.Success = 200;
    ResponseStatus.BadRequest = 400;
    ResponseStatus.Unauthorized = 401;
    ResponseStatus.NotFound = 404;
    ResponseStatus.UpgradeRequired = 426;
    ResponseStatus.AccountDeactivated = 3001;
    ResponseStatus.InternalServerError = 500;
    ResponseStatus.ServiceUnavailable = 503;
    return ResponseStatus;
})();

const TableNames = (function() {
    function TableNames() {};
    TableNames.User = 'users';
    TableNames.GroupChat = 'groupchats';
    TableNames.GroupMessage = 'groupmessages';
    TableNames.SocketUsers = 'socketusers';

    return TableNames;
})();

const TableFields = (function () {
    function TableFields() {};
    TableFields.ID = '_id';
    TableFields.name_ = 'name';
    TableFields.email = 'email';
    TableFields.password = 'password';
    TableFields.tokens = 'tokens';
    TableFields.token = 'token';
    TableFields.profilePicture = 'profilePicture';
    TableFields.active = 'active';
    TableFields.isAdmin = 'isAdmin'; 
    TableFields.createdBy = 'createdBy';
    TableFields.groupName = 'groupName';
    TableFields.description = 'description';
    TableFields.participants = 'participants';
    TableFields.userId = 'userId';
    TableFields.joinedAt = 'joinedAt';
    TableFields.leftAt = 'leftAt';
    TableFields.removedParticipants = 'removedParticipants';
    TableFields.participantsCount = 'participantsCount';
    TableFields.lastMessage = 'lastMessage';
    TableFields.lastMsgId = 'lastMsgId';
    TableFields.message = 'message';
    TableFields.senderName = 'senderName';
    TableFields.chatGroupId = 'chatGroupId';
    TableFields.senderDetails = 'senderDetails';
    TableFields.senderId = 'senderId';
    TableFields.messageType = 'messageType';
    TableFields.seenBy = 'seenBy';
    TableFields.deleted = 'deleted';
    TableFields.chatType = 'chatType';
    TableFields.isOnline = 'isOnline';
    TableFields.socketId = 'socketId';
    TableFields.participantId = 'participantId';
    TableFields.createdAt = 'createdAt';
    TableFields.updatedAt = 'updatedAt';

    return TableFields;
})();

const ValidationMsgs = (function () {
    function ValidationMsgs() {};
    ValidationMsgs.CreatedByEmpty = 'CreatedBy required!';
    ValidationMsgs.GroupNameEmpty = 'GroupName required!'; 
    ValidationMsgs.DescriptionEmpty = 'Description required!';
    ValidationMsgs.NameEmpty = 'Name required!';
    ValidationMsgs.EmailEmpty = 'Email required!';
    ValidationMsgs.EmailInvalid = 'Ooopps! Invalid email!';
    ValidationMsgs.DuplicateEmail = 'This email already exists, please use other...';
    ValidationMsgs.PasswordEmpty = 'Password required!';
    ValidationMsgs.PasswordInvalid = 'Invalid password!';
    ValidationMsgs.ProfilePictureEmpty = 'Profile picture required!';
    ValidationMsgs.ActiveEmpty = 'Active field required!';
    ValidationMsgs.SenderIdEmpty = 'SenderId required!';
    ValidationMsgs.SenderNameEmpty = "Sender's name required!";
    ValidationMsgs.MessageEmpty = 'Message required!';
    ValidationMsgs.ChatTypeEmpty = 'ChatType required!';
    ValidationMsgs.AuthFail = 'Opps! Authentication fails';
    ValidationMsgs.UnableToLogin = 'Unable to login!';
    ValidationMsgs.RecordNotFound = 'Record not exists!';
    ValidationMsgs.InvalidMessageStatus = 'Invalid Message Status found!';
    ValidationMsgs.Required = 'Either roomId or both senderId & receiverId are required to fetch chat history.';
    ValidationMsgs.UserIdRequired = 'UserId required!';
    ValidationMsgs.CannotEditMsg = "You can't edit other's message!";
    ValidationMsgs.CannotDeleteOthersMsg = "You can't delete other's message!";
    ValidationMsgs.DataOff = 'You are offline, please on data to send message!';
    ValidationMsgs.LastMsgUserIdEmpty = 'Last message UserId required!';
    ValidationMsgs.ChatGroupIdEmpty = 'ChatGroupId required!';
    ValidationMsgs.MessageTypeEmpty = 'MessageType Required';
    ValidationMsgs.UserExists = 'User with this emailId already exists!';
    ValidationMsgs.UserNotFound = 'User Not Found!';
    ValidationMsgs.ParticipantsEmpty = 'Participants required!';
    ValidationMsgs.ParticipantNotExistInGroup = 'This Participant Not Exist In Group';
    ValidationMsgs.NotGroupMember = 'You can not send message as you are not group member';
    
    return ValidationMsgs;
})();

module.exports = {
    MessageTypes,
    InterfaceTypes,
    ResponseStatus,
    TableFields,
    TableNames,
    ValidationMsgs
}