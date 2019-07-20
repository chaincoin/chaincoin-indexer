module.exports = class BufferWriter{
    constructor(){
        this.buffer = Buffer.alloc(50);
        this.currentPos = 0
    }


    checkBufferSize(requiredBytes)
    {
        if (this.buffer.length < this.currentPos + requiredBytes){
            this.buffer = Buffer.concat([this.buffer,Buffer.alloc(50)]);
            
            this.checkBufferSize(requiredBytes);
        }
    }

    writeUInt8(data){
        this.checkBufferSize(1);

        this.buffer.writeUInt8(data, this.currentPos);
        this.currentPos = this.currentPos + 1;
    }
    
    writeInt8(data){
        this.checkBufferSize(1);

        this.buffer.writeInt8(data, this.currentPos);
        this.currentPos = this.currentPos + 1;
    }
     
    writeUInt16BE(data){
        this.checkBufferSize(2);

        this.buffer.writeUInt16BE(data, this.currentPos);
        this.currentPos = this.currentPos + 2;
    }

    writeUInt16LE(data){
        this.checkBufferSize(2);

        this.buffer.writeUInt16LE(data, this.currentPos);
        this.currentPos = this.currentPos + 2;
    }

    writeInt16BE(data){
        this.checkBufferSize(2);

        this.buffer.writeInt16BE(data, this.currentPos);
        this.currentPos = this.currentPos + 2;
    }

    writeUInt32LE(data){
        this.checkBufferSize(4);

        this.buffer.writeUInt32LE(data, this.currentPos);
        this.currentPos = this.currentPos + 4;
    }

    writeInt32LE(data){
        this.checkBufferSize(4);

        this.buffer.writeInt32LE(data, this.currentPos);
        this.currentPos = this.currentPos + 4;
    }

    writeBigUInt64LE(data){
        this.checkBufferSize(8);

        this.buffer.writeBigUInt64LE(data, this.currentPos);
        this.currentPos = this.currentPos + 8;
    }

    writeBigInt64LE(data){
        this.checkBufferSize(8);

        this.buffer.writeBigInt64LE(data, this.currentPos);
        this.currentPos = this.currentPos + 8;
    }

    writeString(data, length)
    {
        this.checkBufferSize((length || data.length));

        for(var i = 0; i < data.length; i++)
        {
            this.buffer.writeUInt8(data.charCodeAt(i), this.currentPos + i);
        }

        //do we need to pad
        if (length != null)
        {
            for(var i = data.length; i < length; i++)
            {
                this.buffer.writeUInt8(0, this.currentPos + i);
            }

            this.currentPos = this.currentPos + length;
        }
        else
        {
            this.currentPos = this.currentPos + data.length;
        }
    }
    
    writeVarInt(data){

        if (data < 0xFD)  {
            this.checkBufferSize(1);
            this.writeUInt8(data);
        }
        else if (data <=65535) {
            this.checkBufferSize(3);
            this.writeUInt8(0xFD);
            this.writeUInt16LE(data)
        }
        else if (data <=4294967295) {
            this.checkBufferSize(5);
            this.writeUInt8(0xFE);
            this.writeUInt32LE(data)
        }
        else {
            this.checkBufferSize(9);
            this.writeUInt8(0xFF);
            this.writeBigUInt64LE(data)
        }

    }

    writeVarString(data){
        this.writeVarInt(data.length);
        this.writeString(data);
    }
    

    writeInvVec(data){
        this.checkBufferSize(36);

        this.writeUInt32LE(data.type);
        this.writeBuffer(data.hash);
    }

    writeHash(data){
        this.checkBufferSize(32);

        this.writeBuffer(data);
    }

    writeOutPoint(data){
        this.checkBufferSize(36);

        writeHash(data.hash);
        writeUInt32LE(data.vout);
    }


    writeBuffer(buffer){
        this.checkBufferSize(buffer.length);

        for(var i = 0; i < buffer.length; i++)
        {
            this.writeUInt8(buffer.readUInt8(i));
        }
    }


    toBuffer(){
        return this.buffer.slice(0, this.currentPos);
    }
}
