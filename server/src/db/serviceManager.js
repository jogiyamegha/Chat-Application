const {TableNames} = require("../utils/constants");
const allServices = [
    [TableNames.ChatMessage,  require("./services/chatMsgService").deleteMyReferences],
];
// Modified cascade delete function
const mCascadeDelete = async function (tableName, ...deletedRecordIds) {
    deletedRecordIds = deletedRecordIds.filter((a) => a != undefined);
    if (deletedRecordIds.length > 0) {
        console.log("this.ignoreSelfCall",this.ignoreSelfCall)
        if (this.ignoreSelfCall) {
            console.log("ignoreSelfCall value true")
            //To activate this, you need to call this function using .apply({ignoreSelfCall:true}) or .call({ignoreSelfCall:true}) or .bind({ignoreSelfCall:true})
            allServices.forEach(async (a) => {
                console.log(a)
                if (a[0] != tableName) {
                    try {
                        await a[1](mCascadeDelete, tableName, ...deletedRecordIds);
                    } catch (e) {
                        console.log("CascadeDelete Error (1) ", "(" + a[0] + ")", e);
                        throw e;
                    }
                }
            });
        } else {
            console.log("allServices", allServices)
            allServices.forEach(async (a) => {
                console.log("a[0]", a[0])
                console.log("a[1]", a[1])
                try {
                    console.log("mCascadeDelete", mCascadeDelete)
                    await a[1](mCascadeDelete, tableName, ...deletedRecordIds);
                } catch (e) {
                    console.log("CascadeDelete Error (2) ", "(" + a[0] + ")", e);
                    throw e;
                }
            });
        }
    }
};
exports.cascadeDelete = mCascadeDelete;
