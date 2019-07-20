module.exports = class RejectMessage{

    constructor(message, ccode, reason, data)
    {
        this.message = message;
        this.ccode = ccode;
        this.reason = reason;
        this.data = data;
    }

    getCommand(){
        return "reject";
    }
    getPayLoadBuffer(){
        return Buffer.alloc(0);
    }
}