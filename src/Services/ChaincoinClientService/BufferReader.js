
var ipV4Flag = Buffer.from("00000000000000000000FFFF", "hex");

module.exports = class BufferReader{
    constructor(buffer){

        this.readUInt32LE = this.readUInt32LE.bind(this);
        this.readString = this.readString.bind(this);
        this.remainingLength = this.remainingLength.bind(this);
        this.remainingBuffer = this.remainingBuffer.bind(this);
        this.readBuffer = this.readBuffer.bind(this);

        this.buffer = buffer;
        this.currentPos = 0;
    }


    readUInt8(){
        var result = this.buffer.readUInt8(this.currentPos);
        this.currentPos = this.currentPos + 1;

        return result;
    }
    
    readInt8(){
        var result = this.buffer.readUInt8(this.currentPos);
        this.currentPos = this.currentPos + 1;

        return result;
    }
     
    readUInt16BE(){
        var result = this.buffer.readUInt16BE(this.currentPos);
        this.currentPos = this.currentPos + 2;

        return result;
    }

    readUInt16LE(){
        var result = this.buffer.readUInt16LE(this.currentPos);
        this.currentPos = this.currentPos + 2;

        return result;
    }

    readInt16BE(){
        var result = this.buffer.readInt16BE(this.currentPos);
        this.currentPos = this.currentPos + 2;

        return result;
    }

    readUInt32LE(){
        var result = this.buffer.readUInt32LE(this.currentPos);
        this.currentPos = this.currentPos + 4;

        return result;
    }

    readInt32LE(){
        var result = this.buffer.readInt32LE(this.currentPos);
        this.currentPos = this.currentPos + 4;

        return result;
    }

    readBigUInt64LE(){
        var result = this.buffer.readBigUInt64LE(this.currentPos);
        this.currentPos = this.currentPos + 8;

        return result;
    }

    readBigInt64LE(){
        var result = this.buffer.readBigInt64LE(this.currentPos);
        this.currentPos = this.currentPos + 8;

        return result;
    }

    readString(length)
    {
        var result = "";
        for(var i = 0; i < length; i++)
        {
            var charCode = this.buffer.readUInt8(this.currentPos + i);
            if (charCode != 0 ) result = result + String.fromCharCode(charCode);
        }

        this.currentPos = this.currentPos + length;

        return result;
    }
    
    readVarInt(){

        var byte1 = this.readUInt8();

        if (byte1 < 0xFD) return byte1;
        if (byte1 == 0xFD) return this.readUInt16LE();
        if (byte1 <= 0xFE) return this.readUInt32LE();
        if (byte1 <= 0xFF) return this.readBigUInt64LE();
    }

    readVarString(){
        var length = this.readVarInt();
        return this.readString(length);
    }
    
    readVarBuffer(length){
        var length = this.readVarInt();
        return this.readBuffer(length);
    }

    readBool()
    {
        return this.readUInt8() == 1 ? true : false;
    }

    readInvVec(){
        var type = this.readUInt32LE();
        var hash = this.readBuffer(32);

        return{
            type,
            hash
        };
    }


    readHash(){
        return this.readBuffer(32);
    }

    readOutPoint(){
        var txid = this.readHash();
        var vout = this.readUInt32LE();

        var output = Buffer.from([...txid].reverse()).toString("hex") + "-" + vout;

        return{
            txid,
            vout,
            output
        };
    }

   /* readPubKey(){
        
        if (this.buffer.readUInt8(this.currentPos) == 4) return this.readBuffer(65);
        else return this.readBuffer(33);
    }*/

    readService(){
        var address = null;

        if (Buffer.compare(this.buffer.slice(this.currentPos, this.currentPos + 12),ipV4Flag) == 0)
        {
            this.readBuffer(12);
            var ipv4Byte1 = this.readUInt8();
            var ipv4Byte2 = this.readUInt8();
            var ipv4Byte3 = this.readUInt8();
            var ipv4Byte4 = this.readUInt8();

            address = ipv4Byte1 + "." + ipv4Byte2 + "." + ipv4Byte3 + "." + ipv4Byte4;
        }
        else
        {
            var ipv6Short1 = this.readUInt16BE();
            var ipv6Short2 = this.readUInt16BE();
            var ipv6Short3 = this.readUInt16BE();
            var ipv6Short4 = this.readUInt16BE();
            var ipv6Short5 = this.readUInt16BE();
            var ipv6Short6 = this.readUInt16BE();
            var ipv6Short7 = this.readUInt16BE();
            var ipv6Short8 = this.readUInt16BE();

            address = "[" + ipv6Short1.toString(16) + ":" + ipv6Short2.toString(16) + ":" + ipv6Short3.toString(16) + ":" + ipv6Short4.toString(16) + ":" + ipv6Short5.toString(16) + ":" + ipv6Short6.toString(16) + ":" + ipv6Short7.toString(16) + ":" + ipv6Short8.toString(16) + "]";
        }
        
        var port = this.readUInt16BE();

        return{
            address,
            port
        }
    }

    readAddress(isVersionMessage){

        var time = 0;
        if (isVersionMessage != true) time = this.readUInt32LE();

        var service = this.readBigUInt64LE();
        
        var address = null;

        if (Buffer.compare(this.buffer.slice(this.currentPos, this.currentPos + 12),ipV4Flag) == 0)
        {
            this.readBuffer(12);
            var ipv4Byte1 = this.readUInt8();
            var ipv4Byte2 = this.readUInt8();
            var ipv4Byte3 = this.readUInt8();
            var ipv4Byte4 = this.readUInt8();

            address = ipv4Byte1 + "." + ipv4Byte2 + "." + ipv4Byte3 + "." + ipv4Byte4;
        }
        else
        {
            var ipv6Short1 = this.readUInt16BE();
            var ipv6Short2 = this.readUInt16BE();
            var ipv6Short3 = this.readUInt16BE();
            var ipv6Short4 = this.readUInt16BE();
            var ipv6Short5 = this.readUInt16BE();
            var ipv6Short6 = this.readUInt16BE();
            var ipv6Short7 = this.readUInt16BE();
            var ipv6Short8 = this.readUInt16BE();

            address = "[" + ipv6Short1.toString(16).padStart(4, "0") + ":" + ipv6Short2.toString(16).padStart(4, "0") + ":" + ipv6Short3.toString(16).padStart(4, "0") + ":" + ipv6Short4.toString(16).padStart(4, "0") + ":" + ipv6Short5.toString(16).padStart(4, "0") + ":" + ipv6Short6.toString(16).padStart(4, "0") + ":" + ipv6Short7.toString(16).padStart(4, "0") + ":" + ipv6Short8.toString(16).padStart(4, "0") + "]";
        }
        
        var port = this.readUInt16LE();

        return{
            time,
            service,
            address,
            port
        }
    }

    readBuffer(length){
        var result = this.buffer.slice(this.currentPos, this.currentPos + length);
        this.currentPos = this.currentPos + length;
        return result;
    }

    remainingLength(){
        return this.buffer.length - this.currentPos;
    }

    remainingBuffer(){
        return this.buffer.slice(this.currentPos);
    }
    
}
