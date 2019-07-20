module.exports = class SendHeadersMessage{


    getCommand(){
        return "sendheaders";
    }
    getPayLoadBuffer(){
        return Buffer.alloc(0);
    }
}