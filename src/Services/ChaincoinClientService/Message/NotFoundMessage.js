const BufferWriter = require('../BufferWriter');

module.exports = class InventoryMessage {

    constructor(inventoryVectors)
    {
        this.inventoryVectors = inventoryVectors;
    }

    getCommand(){
        return "notfound";
    }
    getPayLoadBuffer(){

        var bufferWriter = new BufferWriter();
        bufferWriter.writeVarInt(this.inventoryVectors.length);

        this.inventoryVectors.forEach(inventoryVector => {
            bufferWriter.writeInvVec(inventoryVector);
        });

        return bufferWriter.toBuffer();
    }
    
}