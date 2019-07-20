module.exports = class PingMessage{

    constructor(nonce)
    {
        this.nonce = nonce;
    }

    getCommand(){
        return "ping";
    }
    getPayLoadBuffer(){
        var buffer = Buffer.alloc(8);
        buffer.writeBigUInt64LE(this.nonce);

        return buffer;
    }
}