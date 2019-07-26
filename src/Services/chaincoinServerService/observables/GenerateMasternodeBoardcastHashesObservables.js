const { of } = require('rxjs');


const MasternodeBroadcastMessage = require(( process.env.chaincoinClientSource || 'Z:/Software/Chaincoin/Tools/Chaincoin Client') + '/Messages/MasternodeBroadcastMessage');
const MasternodePingMessage = require(( process.env.chaincoinClientSource || 'Z:/Software/Chaincoin/Tools/Chaincoin Client') + '/Messages/MasternodePingMessage');

module.exports = function (ChaincoinServerService) {

  return (masternodeBroadcastData) => {


    var output = masternodeBroadcastData.masternodeOutPoint.split("-");


    var masternodeOutput = {txid: Buffer.from([...Buffer.from(output[0],"hex")].reverse()),vout: parseInt(output[1])};

    var masternodePing = new MasternodePingMessage(
        masternodeOutput,
        Buffer.from([...Buffer.from(masternodeBroadcastData.lastPing.blockHash,"hex")].reverse()),
        BigInt(masternodeBroadcastData.lastPing.sigTime),
        masternodeBroadcastData.lastPing.vchSig != null ? Buffer.from(masternodeBroadcastData.lastPing.vchSig,"hex"): null,
        masternodeBroadcastData.lastPing.fSentinelIsCurrent,
        masternodeBroadcastData.lastPing.nSentinelVersion,
        masternodeBroadcastData.lastPing.nDaemonVersion
    );

    

    var masternodeBroadcast = new MasternodeBroadcastMessage(
        masternodeOutput,
        masternodeBroadcastData.addr,
        masternodeBroadcastData.payee,
        masternodeBroadcastData.pubKeyCollateralAddress != null ? Buffer.from(masternodeBroadcastData.pubKeyCollateralAddress,"hex") : null,
        masternodeBroadcastData.pubKeyMasternode != null ? Buffer.from(masternodeBroadcastData.pubKeyMasternode,"hex") : null,
        masternodeBroadcastData.sig != null ? Buffer.from(masternodeBroadcastData.sig,"hex") : null,
        BigInt(masternodeBroadcastData.sigTime),
        masternodeBroadcastData.nProtocolVersion,
        masternodePing
    );


    return of({
        masternodePingHash: masternodePing.getSignatureHash().toString("hex"),
        masternodeBroadcastHash: masternodeBroadcast.getSignatureHash().toString("hex")
    });
  };
};
