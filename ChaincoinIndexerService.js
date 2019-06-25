
var zmq = require('zeromq');
var Big = require('big.js');

class ChaincoinIndexerService{

    

    constructor(chaincoinApi, currentBlockPos, endBlockPos) {
        this.timerId = null;
        this.runPromise = null;
        this.chaincoinApi = chaincoinApi;

        this.chaincoinZmq = null;
        this.chaincoinZmqSock = null;

        this.currentBlockPos = currentBlockPos;
        this.endBlockPos = endBlockPos;

        this.asyncBlockSync = 100;

        this.blockDatasCallback = null;
        this.onError = null;


    }
    


    start()
    {
        if (this.timeoutId != null) throw "Service already started";
        this.timeoutId = setTimeout(()=>{
            this.runPromise = this.run()
        }, 0);

        if (this.chaincoinZmq != null)
        {
            this.chaincoinZmqSock = zmq.socket('sub');
            this.chaincoinZmqSock.connect(this.chaincoinZmq);
            this.chaincoinZmqSock.subscribe('pubhashblock');
            this.chaincoinZmqSock.subscribe('pubhashtx');
            this.chaincoinZmqSock.subscribe('hashblock');
            this.chaincoinZmqSock.subscribe('hashtx');

            this.chaincoinZmqSock.on('message', function (topic, message, sequence) {

                var topic = topic.toString('utf8');
                var sequence = sequence.readUInt32LE();

                if (topic === 'hashblock') {
                    //if we havent been stopped then run 
                    if (this.timeoutId != null) runPromise = runPromise.then(()=>{
                        this.runPromise = this.run();
                    });
                }
            });    
        }
        
    }

    stop()
    {
        if (this.timeoutId == null) throw "Service not started";
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
    }

    isRunning(){
        return this.timeoutId != null;
    }

    async run(){

        clearTimeout(this.timeoutId);

        try{

            var endPosition = this.endBlockPos != null ? this.endBlockPos : await this.chaincoinApi.getBlockCount();


            while(this.currentBlockPos < endPosition)
            {
                var blockDataPromises = [];
                for(var currentBlockPos = this.currentBlockPos; currentBlockPos < this.currentBlockPos + this.asyncBlockSync && currentBlockPos < endPosition; currentBlockPos++)
                {
                    blockDataPromises.push(this.ProcessBlock(currentBlockPos));
                }

                var blockDatas = await Promise.all(blockDataPromises);

                if (this.blockDatasCallback != null) await this.blockDatasCallback(blockDatas);

                this.currentBlockPos = this.currentBlockPos + blockDatas.length;

                //have we been asked to stop
                if (this.timeoutId == null) break;
            }


            if (this.endBlockPos != null && this.currentBlockPos >= this.endBlockPos)
            {
                this.stop();
                return;
            }

        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        

        if (this.timeoutId != null) this.timeoutId = setTimeout(()=>{
            this.runPromise = this.run()
        }, 60000);
    }



    async ProcessBlock(blockId)
    {
        var block = await this.chaincoinApi.getBlock(blockId);
        var previousBlock = blockId > 1 ? await this.chaincoinApi.getBlock(blockId - 1) : null;

        var hashRate = previousBlock != null ? block.difficulty * 2**256 / (0xffff * 2**208) / (block.time - previousBlock.time): 0

        var blockData = {
            dbBlock : {
                _id: block.height,
                hash: block.hash,
                previousblockhash: block.previousblockhash,
                difficulty: block.difficulty,
                hashRate: hashRate,
                date: new Date(block.time * 1000),
                value: new Big(0), 
                tx:[]
            },
            transactionDatas:[]
        }
         

        var promises = [];

        for(var txPos = 0; txPos < block.tx.length; txPos++)
        {
            promises.push(this.ProcessTransaction(block,blockData, block.tx[txPos]));
        }

        await Promise.all(promises);

        return blockData;
    }


    async ProcessTransaction(block, blockData, txid)
    {
        var transaction = await this.chaincoinApi.getTransaction(txid);

        var transactionData = {
            recipients: {},
            value: new Big(0), 
            dbTransaction: {
                _id: txid,
                height: block.height,
                vin: []
            },
            dbAddressTxs:[],
            dbAddressTxUpdates:[],
            addresses:{}
        };

        blockData.transactionDatas.push(transactionData);

        var promises = [];

        for(var i = 0; i < transaction.vin.length; i++)
        {
            promises.push(this.ProcessVin(block, transaction, transactionData, transaction.vin[i]));
        }


        for(var i = 0; i < transaction.vout.length; i++)
        {
            promises.push(this.ProcessVout(block, transaction, transactionData, transaction.vout[i]));
        }


        await Promise.all(promises);

        blockData.dbBlock.value = blockData.dbBlock.value.add(transactionData.value);
        blockData.dbBlock.tx.push({
            txid: txid,
            recipients: Object.keys(transactionData.recipients).length,
            value: transactionData.value
        });

    }


    async ProcessVin(block, transaction, transactionData, vin)
    {
        if (vin.coinbase != null ){
            return;
        }


        var vinTransaction = await this.chaincoinApi.getTransaction(vin.txid);

        var vout = vinTransaction.vout[vin.vout]

        var address = vout.scriptPubKey.addresses[0];

        transactionData.addresses[address] = address;

        var tx = {
            _id: address + "-" + transaction.txid + "-vin[" + transaction.vin.indexOf(vin) + "]", //TODO: remove address from the _id
            address: address,
            txid: transaction.txid,
            type: "vin",
            vin: transaction.vin.indexOf(vin),
            value: new Big("-" + vout.value), 
            time:transaction.time,
            blockHeight: block.height
        };


        transactionData.dbAddressTxs.push(tx);

        transactionData.dbTransaction.vin.push(Object.assign({
            address: address,
            value: vout.value,
        },vin));


        var updateSpentTx = {
            _id: address + "-" + vinTransaction.txid + "-vout[" + vin.vout + "]",
            spent: true
        };
        transactionData.dbAddressTxUpdates.push(updateSpentTx);

    }

    async ProcessVout(block, transaction, transactionData, vout)
    {
        if (vout.value == 0 || vout.scriptPubKey.addresses == null){
            return;
        }

        var address = vout.scriptPubKey.addresses[0];
        transactionData.addresses[address] = address;
        transactionData.recipients[address] = address;

        transactionData.value = transactionData.value.add(new Big(vout.value));

        var tx = {
            _id: address + "-" + transaction.txid + "-vout[" + transaction.vout.indexOf(vout) + "]", //TODO: remove address from the _id
            address: address,
            txid: transaction.txid,
            type: "vout",
            vout: transaction.vout.indexOf(vout),
            value: new Big(vout.value),
            time:transaction.time,
            blockHeight: block.height,
            spent: false
        };

        if (transaction.vin[0].coinbase != null){
            var outValue = new Big(0);
            transaction.vout.forEach(vout => outValue = outValue.add(new Big(vout.value))); 

            if (new Big(vout.value).div(outValue).toString() == "0.2"){ //TODO: This only works since the dev fund
                tx.payout = "masternode";
            }
            else
            {
                tx.payout = "miner";
            }
        }

        transactionData.dbAddressTxs.push(tx);

    }

    

}


module.exports = ChaincoinIndexerService;