module.exports = class MasternodePingMessage{

    constructor(masternodeOutPoint, blockHash, sigTime, vchSig, fSentinelIsCurrent, nSentinelVersion, nDaemonVersion)
    {
        this.masternodeOutPoint = masternodeOutPoint;
        this.blockHash = blockHash;
        this.sigTime = sigTime;
        this.vchSig = vchSig;
        this.fSentinelIsCurrent = fSentinelIsCurrent;
        this.nSentinelVersion = nSentinelVersion;
        this.nDaemonVersion = nDaemonVersion;
    }

    getCommand(){
        return "mnp";
    }
    getPayLoadBuffer(){
        var buffer = Buffer.alloc(0);
        //buffer.writeBigUInt64LE(this.nonce);
        return buffer;
    }
}