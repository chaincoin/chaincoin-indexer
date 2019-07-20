module.exports = class VersionAckMessage{
    getCommand(){
        return "verack";
    }
    getPayLoadBuffer(){
        return Buffer.alloc(0);
    }
}