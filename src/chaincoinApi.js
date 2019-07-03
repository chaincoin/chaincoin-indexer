const http = require('http');
const pLimit = require('p-limit');





 
 

class ChaincoinApi{

    constructor(rpcHost, rpcPort,rpcUser, rpcPassword) {
        this.rpcHost = rpcHost;
        this.rpcPort = rpcPort;
        this.rpcUser = rpcUser;
        this.rpcPassword = rpcPassword;


        this.rpcLimit = pLimit(10);
    }

    getBestBlockHash() {
        return this.rpcRequest("getbestblockhash",[]);
    }
    
    async getBlock(hash){
        if (isNaN(hash) == false) hash = await GetBlockHash(parseInt(hash));
        return await this.rpcRequest("getblock",  [hash]);
    }
    
    getBlockCount() {
        return this.rpcRequest("getblockcount",[]);
    }
    
    
    getBlockHash(blockId)  {
        return this.rpcRequest("getblockhash",[parseInt(blockId)]);
    }
    
    
    getDifficulty() {
        return this.rpcRequest("getdifficulty", []);
    }
    
    
    
    getChainTips() {
        return this.rpcRequest("getchaintips", []);
    }
    
    
    getChainTxStats(blockhash) {
        var parameters = [];
        if (blockhash == null || blockhash == "") parameters.push(blockhash);
        return this.rpcRequest("getchaintxstats", [blockhash]);
    }
    
    
    
    estimateSmartFee(blockCount) {
        return this.rpcRequest("estimateSmartFee", [blockCount]);
    }
    
    
    getMemPoolInfo() {
        return this.rpcRequest("getmempoolinfo", []);
    }
    
    
    getRawMemPool() {
        return this.rpcRequest("getrawmempool", []);
    }
    
    getMemPoolEntry(txid) {
        return this.rpcRequest("getmempoolentry ", [txid]);
    }
    
    
    
    getRawTransaction(txid) {
        return this.rpcRequest("getrawtransaction", [txid]);
    }
    
    getTransaction(txid) {
        return this.rpcRequest("getrawtransaction", [txid,1]);
    }
    
    
    verifyMessage(address, signature, message)  {
        return this.rpcRequest("verifymessage", [address,signature,message]);
    }
    
    validateAddress(address)  {
        return this.rpcRequest("validateaddress", [address]);
    }
    
    
    sendRawTransaction(hex, allowHighFees)  {
        return this.rpcRequest("sendrawtransaction", [hex,allowHighFees]);
    }
    
    
    decodeRawTransaction(rawTransaction)  {
        return this.rpcRequest("decoderawtransaction", [rawTransaction]);
    }
    
    
    getNetworkHashps(blockId) {
        return this.rpcRequest("getnetworkhashps", [blockId],);
    }
 
    getTxOutSetInfo() {
        return this.rpcRequest("gettxoutsetinfo", []);
    }
    
    
    getPeerInfo()  {
        return this.rpcRequest("getpeerinfo", []);
    }
    
    getMasternodeList() {
        return this.rpcRequest("masternodelist", []);
    }
    
    getMasternodeCount() {
        return this.rpcRequest("masternode", ["count"],);
    }
    
    
    getConnectionCount() {
        return this.rpcRequest("getconnectioncount", []);
    }
    
    getBip9Softforks() {
        return this.getBlockchainInfo.then(blockchainInfo => blockchainInfo.bip9_softforks);
    }
    
    
    getBlockchainInfo() {
        return this.rpcRequest("getblockchaininfo", []);
    }

    
    
    getBlockTemplate(args) {
        return this.rpcRequest("getblocktemplate", args);
    }
    
    submitBlock(blockHex) {
       return this.rpcRequest("submitblock", [blockHex, "10"]);
    }
    
    
    getMasternodeWinners() {
        return this.rpcRequest("masternode", ["winners"])
    }
    
    getMasternodePrivateKey() {
        return this.rpcRequest("masternode", ["genkey"]);
    }

    rpcRequest(method, params){


        return this.rpcLimit(() =>new Promise((resolve, reject) => {
            var auth = 'Basic ' + Buffer.from(this.rpcUser + ':' + this.rpcPassword).toString('base64');
    
    
            var headers = {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/json-rpc',
                'Accept': 'application/json-rpc',
                'Authorization': auth
            }
    
            var options = {
                hostname: this.rpcHost,
                port: this.rpcPort,
                method: 'POST',
                headers: headers
            };
    
            var req = http.request(options, (resp) => {
                var data = '';
    
                if (resp.statusCode != 200) {
                    var t = method;
                    var a = params;
                    console.log("statusCode: ", resp.statusCode);
                }
    
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
    
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
    
                    try
                    {
                        var result = JSON.parse(data);
                        if (result.error != null) reject(result.error);
                        else resolve(result.result);
                    }
                    catch(ex)
                    {
                        reject(ex);
                    }
                    
                });
    
    
    
            }).on("error", (err) => {
                reject("Error: " + err.message);
            });
    
            req.write(JSON.stringify({
                jsonrpc: '1.0',
                method: method,
                params: params,
                id: 1
            }));
    
            req.end();
        }));
    }

}


module.exports = ChaincoinApi;