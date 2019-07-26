const ChaincoinServer = require(( process.env.chaincoinClientSource || 'Z:/Software/Chaincoin/Tools/Chaincoin Client') + '/ChaincoinServer');





class ChaincoinServerService{

    constructor() {
        this.chaincoinServer = new ChaincoinServer();
        if (process.env.chaincoinHost != null) chaincoinServer.outBoundHosts[0] == process.env.chaincoinHost;


        this.GenerateMasternodeBoardcastHashes = require('./observables/GenerateMasternodeBoardcastHashesObservables')(this);
        this.SendMasternodeBoardcast = require('./observables/SendMasternodeBoardcastObservables')(this);
    }


    start()
    {
        this.chaincoinServer.listen.next(false);
        this.chaincoinServer.Start();
    }


    stop()
    {
        this.chaincoinServer.Stop();
    }

}



module.exports = ChaincoinServerService;
