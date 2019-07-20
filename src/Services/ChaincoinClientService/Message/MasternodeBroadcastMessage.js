module.exports = class MasternodeBroadcastMessage{

    constructor(masternodeOutPoint, addr, payee, pubKeyCollateralAddress, pubKeyMasternode, sig, sigTime, nProtocolVersion, lastPing, nLastDsq)
    {
        this.masternodeOutPoint = masternodeOutPoint;
        this.addr = addr;
        this.payee = payee; //ascii encoded address
        this.pubKeyCollateralAddress = pubKeyCollateralAddress;
        this.pubKeyMasternode = pubKeyMasternode;
        this.sig = sig;
        this.sigTime = sigTime;
        this.nProtocolVersion = nProtocolVersion;
        this.lastPing = lastPing;
        this.nLastDsq = nLastDsq;
    }

    getCommand(){
        return "mnb";
    }
    getPayLoadBuffer(){
        var buffer = Buffer.alloc(0);
        //buffer.writeBigUInt64LE(this.nonce);
        return buffer;
    }
}