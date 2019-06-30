var http = require('http');
var WebSocket = require('ws');
var first = require('rxjs/operators').first;

class HttpService{


    constructor(port, chaincoinService, indexApi) {
        this.port = port;
        
        this.server = null;
        this.wsServer = null;
        this.serverMethods = chaincoinServiceToMethods(chaincoinService);
        this.serverObservables = chaincoinServiceToObservables(chaincoinService);

        this.webSockets = [];




        this.handleHttpRequest = async(req, res) =>
        {
            var blockCount = await this.serverMethods.getBlockCount();
        }

        this.handleWsConnection = async(ws)  =>
        {
            this.webSockets.push(new WebSocketConnection(ws, this));
        }

        this.cleanWsConnection = async(webSocket) =>{
            webSocket.subscriptions.forEach(subscription => subscription.unsubscribe());
        }
    }
    


    start()
    {
        if (this.server != null) throw "Service already started";
        this.server = http.createServer(this.handleHttpRequest);
        this.wsServer = new WebSocket.Server({ server: this.server });
        this.wsServer.on('connection',this.handleWsConnection);

        this.server.listen(this.port);
    }

    stop()
    {
        if (this.server == null) throw "Service not started";
        
    }

    isRunning(){
        return this.server != null;
    }

    

}

var chaincoinServiceToMethods = (chaincoinService) =>{
    return {
        ping:() => "pong",
        getBlockCount:() => {
            return chaincoinService.BlockCount.pipe(first()).toPromise()
        },
        getBlock:(blockHash) => {
            return chaincoinService.Block(blockHash).pipe(first()).toPromise()
        }
    }
}

var chaincoinServiceToObservables = (chaincoinService) =>{
    return {
        BlockCount: () => chaincoinService.BlockCount,
        Block:(blockHash) => {
            return chaincoinService.Block(blockHash);
        }
    }
}


module.exports = HttpService;



class WebSocketConnection{


    constructor(ws,httpService) {
        this.ws = ws;
        this.httpService = httpService;

        this.subscriptions = [];

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

        



        var processFunc = this.httpService.serverMethods[request.op];
        if (processFunc == null) {
            this.ws.send(JSON.stringify({
                op: "Response",
                data:"method not found",
                success:false
            }));
            return;
        }

        var funcParams = getParamNames(processFunc);

        var parms = funcParams.map(function(item){
            return request[item];
        });

      
        try{

            var data = await processFunc.apply(null,parms);
            this.ws.send(JSON.stringify({
                op: request.op + "Response",
                data: data,
                success:true
            }));
        }
        catch(ex)
        {
            this.ws.send(JSON.stringify({
                op: request.op + "Response",
                success:false
            }));
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