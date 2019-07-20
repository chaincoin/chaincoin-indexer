module.exports = class PongMessage{

    constructor(nonce)
    {
        this.nonce = nonce;
    }

    getCommand(){
        return "pong";
    }
    getPayLoadBuffer(){
        var buffer = Buffer.alloc(8);
        buffer.writeBigUInt64LE(this.nonce);

        return buffer;
    }
}