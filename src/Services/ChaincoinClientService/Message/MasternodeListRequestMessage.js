const BufferWriter = require('../BufferWriter');

const emptyMasternodeOutPoint = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000FFFFFFFF", "hex");

module.exports = class MasternodeListRequestMessage{

    constructor(masternodeOutPoint)
    {
        this.masternodeOutPoint = masternodeOutPoint;
    }

    getCommand(){
        return "dseg";
    }
    getPayLoadBuffer(){
        var bufferWriter = new BufferWriter();

        if (this.masternodeOutPoint != null) bufferWriter.writeOutPoint(this.masternodeOutPoint);
        else {
            bufferWriter.writeBuffer(emptyMasternodeOutPoint)
        }
        //buffer.writeBigUInt64LE(this.nonce);
        return bufferWriter.toBuffer();
    }
}