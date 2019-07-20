

const BufferWriter = require('../BufferWriter');

module.exports = class VersionMessage{
    constructor(version, services, timestamp, addrRecv, addrFrom, nonce, userAgent, startHeight, relay){
       this.version = version;
       this.services = services;
       this.timestamp = timestamp;
       this.addrRecv = addrRecv;
       this.addrFrom = addrFrom;
       this.nonce = nonce;
       this.userAgent = userAgent;
       this.startHeight = startHeight;
       this.relay = relay;
    }


    getCommand(){
        return "version";
    }

    getPayLoadBuffer(){

        var bufferWriter = new BufferWriter();

        bufferWriter.writeInt32LE(this.version);
        bufferWriter.writeBigUInt64LE(this.services,4);
        bufferWriter.writeBigInt64LE(this.timestamp, 12);


        //addrRecv
        {
            bufferWriter.writeBigUInt64LE(this.services,20); 

            //Ip v4 marker
            bufferWriter.writeUInt32LE(0, 28);
            bufferWriter.writeUInt32LE(0, 32); 
            bufferWriter.writeUInt32LE(4294901760, 36); 

            //Ip v4 octecs
            bufferWriter.writeUInt32LE(0, 40);
            bufferWriter.writeUInt16BE(0, 44);
        }
       

        //addrFrom
        {
            bufferWriter.writeBigUInt64LE(this.services,46); 

            //Ip v4 marker
            bufferWriter.writeUInt32LE(0, 54);
            bufferWriter.writeUInt32LE(0, 58); 
            bufferWriter.writeUInt32LE(4294901760, 62); 
    
            //Ip v4 octecs
            bufferWriter.writeUInt32LE(0, 66);
            bufferWriter.writeUInt16BE(0, 70);
        }



        //buffer.writeBigInt64LE(this.addrRecv, 42);

        bufferWriter.writeBigUInt64LE(this.nonce, 72);
        bufferWriter.writeVarString(this.userAgent);
        bufferWriter.writeInt32LE(this.startHeight, 81);
        bufferWriter.writeUInt8(this.relay ? 1 : 0, 85);
        
       /* var buffer = Buffer.from(
            this.versionHex() +
            this.servicesHex() +  
            this.timestampHex() +
            this.addrRecvHex() + 
            this.addrFromHex() +
            this.nonceHex() + 
            this.userAgentHex() +
            this.startHeightHex() + 
            this.relayHex(),
            "hex"
        );*/

        return bufferWriter.toBuffer();
        
    }
}