var http = require('http');
var WebSocket = require('ws');
var url = require('url');
var { combineLatest } = require('rxjs');
var { first, map, switchMap } = require('rxjs/operators');


class HttpService{


    constructor(port, chaincoinService, masternodeService, indexerService) {
        this.port = port;
        
        this.server = null;
        this.wsServer = null;
        this.serverObservables = servicesToObservables(chaincoinService, masternodeService, indexerService);

        this.webSockets = [];




        this.start = () => 
        {
            if (this.server != null) throw "Service already started";
            this.server = http.createServer((req, res) => this.handleHttpRequest(req,res));
            this.wsServer = new WebSocket.Server({ server: this.server });
            this.wsServer.on('connection',this.handleWsConnection);

            this.server.listen(this.port);
        }

        this.stop = () => 
        {
            if (this.server == null) throw "Service not started";
            
        }

        this.isRunning = () => {
            return this.server != null;
        }

        this.handleHttpRequest = async(req, res) => 
        {
            res.setHeader('Access-Control-Allow-Origin', '*');//TODO: this might need to change
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

            var url_parts = url.parse(req.url, true);

            var observableFuncName = url_parts.pathname.substring(4); 
            var observableFunc = this.serverObservables[observableFuncName];
            if (observableFunc == null){
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('\n');

                return;
            } 

            var observableFuncParamNames = getParamNames(observableFunc);

            var observableFuncParams = observableFuncParamNames.map(function(item){
                return url_parts.query[item];
            });


            try
            {
                var data = await observableFunc.apply(null,observableFuncParams).pipe(first()).toPromise();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data, null, 4) + '\n');
            }
            catch(ex)
            {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('failed\n');
            }

        }
        

        this.handleWsConnection = async(ws)  =>
        {
            this.webSockets.push(new WebSocketConnection(ws, this));
        }

        this.cleanWsConnection = async(webSocket) =>{
            Object.keys(webSocket.subscriptions).forEach(subscriptionName => webSocket.subscriptions[subscriptionName].unsubscribe());
        }
    }
   

}


var servicesToObservables = (chaincoinService, masternodeService, indexerService) =>{
    return {

        NewBlockHash: () => chaincoinService.NewBlockHash,
        NewTransactionHash: () => chaincoinService.NewTransactionHash,

        BestBlockHash: () => chaincoinService.BestBlockHash,
        BlockchainInfo: () => chaincoinService.BlockchainInfo,
        BlockCount: () => chaincoinService.BlockCount,
        ChainTxStats:chaincoinService.ChainTxStats,
        NetworkHashps:chaincoinService.NetworkHashps,
        TxOutSetInfo:chaincoinService.TxOutSetInfo,
        EstimateSmartFee: chaincoinService.EstimateSmartFee,
        MemPoolInfo: () => chaincoinService.MemPoolInfo,
        RawMemPool:() => chaincoinService.RawMemPool,

        PeerInfo:() => chaincoinService.PeerInfo,
        ConnectoinCount:() => chaincoinService.ConnectoinCount,

        MasternodeCount:() => chaincoinService.MasternodeCount,
        MasternodeList:() => chaincoinService.MasternodeList,
        Masternode: chaincoinService.MasternodeListEntry,
        MasternodeExtended:(output) => combineLatest(chaincoinService.MasternodeListEntry(output),masternodeService.Masternode(output))
        .pipe(map(([mnEntry, mnIndex]) =>{ 
            return Object.assign({}, mnEntry, mnIndex);
        })),
        MasternodeWinners: () => chaincoinService.MasternodeWinners,


        

        Block:chaincoinService.Block,
        BlockExtended:(hash) => {
            return combineLatest(chaincoinService.Block(hash),indexerService.Block(hash))
            .pipe(map(([block, dbBlock]) =>{ 
                if (dbBlock == null) return block;

                var transaction = dbBlock.tx.map(tx => Object.assign({}, tx,{value: parseFloat(dbBlock.value.toString())}));

                return Object.assign({}, block, dbBlock, {
                    extended:true,
                    value: parseFloat(dbBlock.value.toString()),
                    tx:transaction
                });
            }));
        },
        BlocksExtended:(blockId, pageSize) =>{
            var observables = [];

            for(var i = 0; i < pageSize; i++)
            {
                observables.push(chaincoinService.BlockHash(blockId - i).pipe(
                    switchMap(blockHash => {
                        return combineLatest(chaincoinService.Block(blockHash),indexerService.Block(blockHash)).pipe(map(([block, dbBlock]) =>{ 

                            if (dbBlock == null) return block;

                            var transaction = dbBlock.tx.map(tx => Object.assign({}, tx,{value: parseFloat(tx.value.toString())}));

                            return Object.assign({}, block, dbBlock, {
                                extended:true,
                                value: parseFloat(dbBlock.value.toString()),
                                tx:transaction
                            });
                        }))
                    })
                ));
            }

            return combineLatest(observables);
        },

        BlockHash:chaincoinService.BlockHash,

        Transaction: chaincoinService.Transaction,
        TransactionExtended:(transactionId) => combineLatest(chaincoinService.Transaction(transactionId),indexerService.Transaction(transactionId))
        .pipe(map(([transaction, dbTransaction]) =>{ 

            if (dbTransaction == null) return transaction;

            var vin = dbTransaction.vin.map(vin => Object.assign({}, vin,{value: parseFloat(vin.value.toString())}));

            return Object.assign({}, transaction, dbTransaction, {
                extended:true,
                vin:vin
            });
        })),


        Address: indexerService.Address,
        AddressTx: indexerService.AddressTx,

        MasternodeListEntryAdded: () => chaincoinService.MasternodeListEntryAdded,
        MasternodeListEntryRemoved: () => chaincoinService.MasternodeListEntryRemoved,
        MasternodeListEntryStatusChanged: () => chaincoinService.MasternodeListEntryStatusChanged,
        MasternodeListEntryExpiring: () => chaincoinService.MasternodeListEntryExpiring
    }
}


module.exports = HttpService;



class WebSocketConnection{


    constructor(ws,httpService) {
        this.ws = ws;
        this.httpService = httpService;

        this.subscriptions = {};

        ws.on('message',(message) => this.handleMessage(message));
        ws.on('close', () => httpService.cleanWsConnection(this));
    }

    async handleMessage(message){

        var request = null;
        try{
            request = JSON.parse(message);
        }
        catch(ex)
        {
            this.ws.send(JSON.stringify({
                op: "Response",
                data:"invalid json",
                success:false
            }));
        }

        var messageId = request.id;

        
        if (request.op.endsWith("Subscribe"))
        {
            var observableFuncName = request.op.substring(0, request.op.length - 9);
            var observableFunc = this.httpService.serverObservables[observableFuncName];
            if (observableFunc == null){
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));

                return;
            } 

            var observableFuncParamNames = getParamNames(observableFunc);

            var observableFuncParams = observableFuncParamNames.map(function(item){
                return request[item];
            });
            
            var observableName = observableFuncName;
            observableFuncParams.forEach(observableFuncParam => observableName = observableFuncName + "-" + observableFuncParam);

            if (this.subscriptions[observableName] != null){
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));

                return;
            } 

            this.subscriptions[observableName] = observableFunc.apply(null,observableFuncParams).subscribe((data)=>{
                if (data == null) return; //TODO: handle errors better
                this.ws.send(JSON.stringify({
                    subscriptionId: request.subscriptionId,
                    op: observableFuncName,
                    data: data
                }));
            },(err) =>{
                this.ws.send(JSON.stringify({
                    subscriptionId: request.subscriptionId,
                    op: observableFuncName,
                    error: "An error caused subscription to be terminated"
                }));

                this.subscriptions[observableName] = null;
            });

            this.ws.send(JSON.stringify({
                id: messageId,
                op: request.op + "Response",
                success:true
            }));

            return;
        }
        if (request.op.endsWith("Unsubscribe"))
        {
            var observableFuncName = request.op.substring(0, request.op.length - 11);
            var observableFunc = this.httpService.serverObservables[observableFuncName];
            if (observableFunc == null){
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));

                return;
            } 

            var observableFuncParamNames = getParamNames(observableFunc);

            var observableFuncParams = observableFuncParamNames.map(function(item){
                return request[item];
            });
            
            var observableName = observableFuncName;
            observableFuncParams.forEach(observableFuncParam => observableName = observableFuncName + "-" + observableFuncParam);

            if (this.subscriptions[observableName] == null) {
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));

                return;
            }

            this.subscriptions[observableName].unsubscribe();
            delete this.subscriptions[observableName];

            this.ws.send(JSON.stringify({
                id: messageId,
                op: request.op + "Response",
                success:true
            }));
            return;
        }
        

        if (request.op.startsWith("get"))
        {
            var observableFuncName = request.op.substring(3);
            var observableFunc = this.httpService.serverObservables[observableFuncName];
            if (observableFunc == null){
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));

                return;
            } 

            var observableFuncParamNames = getParamNames(observableFunc);

            var observableFuncParams = observableFuncParamNames.map(function(item){
                return request[item];
            });

            try{

                var data = await observableFunc.apply(null,observableFuncParams).pipe(first()).toPromise();
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    data: data,
                    success:true
                }));
            }
            catch(ex)
            {
                this.ws.send(JSON.stringify({
                    id: messageId,
                    op: request.op + "Response",
                    success:false
                }));
            }

        }

    }
}



var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}