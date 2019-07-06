
var mongodbDecimal = require('mongodb').Decimal128;
var Big = require('big.js');

var  { Subject } = require('rxjs');
var { first, filter  } = require('rxjs/operators');

class IndexerService{

    

    constructor(chaincoinService, indexApi) {

        this.chaincoinService = chaincoinService;
        this.indexApi = indexApi;

        this.currentBlockHash = null;

        this.bestBlockHashSubscription = null;
        this.asyncBlockSync = 1000;

        this.onError = new Subject();

        
        this.BlockAdded = new Subject();
        this.BlocksAdded = new Subject();
        this.TransactionAdded = new Subject();
        this.AddressUpdated = new Subject();
        this.AddressesInserted = new Subject(); 
        this.ProcessingLoopComplete = new Subject(); 
        

        this.Block = require('./Observables/BlockObservables')(this);
        this.Transaction = require('./Observables/TransactionObservables')(this);
        this.Address = require('./Observables/AddressObservables')(this);
        this.AddressTx = require('./Observables/AddressTxObservables')(this);
        this.AddressTxs = require('./Observables/AddressTxsObservables')(this);
        this.AddressUnspent = require('./Observables/AddressUnspentObservables')(this);
        this.PayOutStats = require('./observables/PayOutStatsObservables')(this);

        this.RichListCount = require('./Observables/RichListCountObservable')(this);
        this.RichList = require('./Observables/RichListObservables')(this);
    }
    


    start()
    {
        if (this.bestBlockHashSubscription != null) throw "Service already started";
        this.bestBlockHashSubscription = this.chaincoinService.BestBlockHash.pipe(first()).subscribe((bestBlockHash => this.run(bestBlockHash)));
    }

    stop()
    {
        if (this.bestBlockHashSubscription == null) throw "Service not started";
        this.bestBlockHashSubscription.unsubscribe();
        this.bestBlockHashSubscription = null;
    }

    isRunning(){
        return this.bestBlockHashSubscription != null;
    }

    async run(bestBlockHash){


        try{


            if (this.currentBlockHash == null)
            {
                var topBlock = await this.indexApi.getTopBlock();
                if (topBlock != null) this.currentBlockHash = topBlock.hash;
                else this.currentBlockHash = "00000f639db5734b2b861ef8dbccc33aebd7de44d13de000a12d093bcc866c64";
            }
  

            //Check our latest block is still in the chain
            var currentBlock = await this.chaincoinService.Block(this.currentBlockHash).pipe(first()).toPromise();

            if (currentBlock.confirmations == -1) {
                //TODO: Reorg, work back through chain and find where fork happened
                //currentBlock.previousblockhash
            }

            //var newBlocks = (await this.chaincoinService.Blocks(currentBlock.height + this.asyncBlockSync,this.asyncBlockSync).pipe(first()).toPromise()).reverse();
            //TODO: check there hasnt been a reorg in data


            var newBlock = null;
            var newBlocks = [];
            if (currentBlock.nextblockhash != null)
            { 
                for(var i = 0; i < this.asyncBlockSync; i++)
                {
                    newBlock = await this.chaincoinService.Block((newBlock || currentBlock).nextblockhash).pipe(first()).toPromise();

                    if (newBlock.confirmations == -1) {
                        //TODO: Reorg, work back through chain and find where fork happened
                        //currentBlock.previousblockhash
                    }
        

                    newBlocks.push(newBlock);
                    if (newBlock.nextblockhash == null) break;

                    if (this.bestBlockHashSubscription == null) return;
                }

                var blockDataPromises = newBlocks.map(newBlock => this.ProcessBlock(newBlock));
                var blockDatas = await Promise.all(blockDataPromises);

                await this.SaveBlockDatas(blockDatas);

                if (newBlocks.length > 0) this.currentBlockHash = newBlocks[newBlocks.length - 1].hash;
            }
            

            if (this.bestBlockHashSubscription == null) return;


            

        }
        catch(ex)
        {
            this.onError.next(ex);
        }
        
        if (this.bestBlockHashSubscription != null)
        {
            //Setup new subscription but filter the best block hash out if it matches out current block hash,
            //this should filter out the tip hash if we have got to it, other wise it will trigger again
            this.bestBlockHashSubscription = this.chaincoinService.BestBlockHash.pipe(filter(newBestBlockHash => newBestBlockHash != this.currentBlockHash),first()).subscribe((bestBlockHash) => this.run(bestBlockHash));
        }

        this.ProcessingLoopComplete.next({});
    }


    async SaveBlockDatas(blockDatas){

        const concat = (x,y) => x.concat(y);
        const flatMap = (xs, f) => xs.map(f).reduce(concat, []);

        var dbAddressTxs = flatMap(blockDatas,blockData => flatMap(blockData.transactionDatas,transactionData => transactionData.dbAddressTxs));
        dbAddressTxs.forEach(dbAddressTx => dbAddressTx.value = mongodbDecimal.fromString(dbAddressTx.value.toString()));
        if (dbAddressTxs.length > 0) await this.indexApi.saveAddressTxs(dbAddressTxs);

        

        var dbAddressTxUpdates = flatMap(blockDatas,blockData => flatMap(blockData.transactionDatas,transactionData => transactionData.dbAddressTxUpdates));
        if (dbAddressTxUpdates.length > 0) await this.indexApi.saveSpendAddressTxs(dbAddressTxUpdates); //TODO: maybe i should be checking to see if the address tx is in the dbAddressTxs, if it is update it and filter out
        


        var addressIdsObject = {};
        blockDatas.forEach(blockData => blockData.transactionDatas.forEach(transactionData => {
            addressIdsObject = Object.assign(addressIdsObject,transactionData.addresses);
        }));

        var addressIds = Object.keys(addressIdsObject);
        if (addressIds.length > 0){
            var addressSummaries = await this.indexApi.getCalculateAddresses(addressIds);
            addressSummaries.forEach(addressSummary => addressSummary._id = addressSummary.address);
    
            var saveAddressesResult = await this.indexApi.saveAddresses(addressSummaries);
            if (saveAddressesResult.nInserted != 0) this.AddressesInserted.next(saveAddressesResult.nInserted);

            //Trigger Observables
            addressSummaries.forEach(addressSummary => this.AddressUpdated.next(addressSummary));
        }
        
        
        



        var dbTransactions = flatMap(blockDatas,blockData => blockData.transactionDatas.map(transactionData => transactionData.dbTransaction));
        dbTransactions.forEach(dbTransaction => dbTransaction.vin.forEach(vin => {
            if (vin.value != null) vin.value = mongodbDecimal.fromString(vin.value.toString())
        }));
        if (dbTransactions.length > 0) await this.indexApi.saveTransactions(dbTransactions);

        //Trigger Observables
        dbTransactions.forEach(dbTransaction => this.TransactionAdded.next(dbTransaction));




        var dbBlocks = blockDatas.map(blockData => blockData.dbBlock);
        dbBlocks.forEach(dbBlock =>{
            dbBlock.value = mongodbDecimal.fromString(dbBlock.value.toString());
            dbBlock.tx.forEach(tx => tx.value = mongodbDecimal.fromString(tx.value.toString()));
        });
        if (dbBlocks.length > 0) await this.indexApi.saveBlocks(dbBlocks);

        //Trigger Observables
        dbBlocks.forEach(dbBlock => this.BlockAdded.next(dbBlock));
    }


    async ProcessBlock(block)
    {

        var previousBlock = block.previousblockhash != null ? await this.chaincoinService.Block(block.previousblockhash).pipe(first()).toPromise() : null;

        var hashRate = previousBlock != null ? block.difficulty * 2**256 / (0xffff * 2**208) / (block.time - previousBlock.time): 0

        var blockData = {
            dbBlock : {
                _id: block.height,
                hash: block.hash,
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
        var transaction = await this.chaincoinService.Transaction(txid).pipe(first()).toPromise();

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
            transactionData.dbTransaction.vin.push(vin);
            return;
        }


        var vinTransaction = await this.chaincoinService.Transaction(vin.txid).pipe(first()).toPromise();

        var vout = vinTransaction.vout[vin.vout]

        var address = vout.scriptPubKey.addresses[0];

        transactionData.addresses[address] = address;

        var tx = {
            _id: transaction.txid + "-vin[" + transaction.vin.indexOf(vin) + "]", 
            address: address,
            txid: transaction.txid,
            type: "vin",
            vin: transaction.vin.indexOf(vin),
            value: new Big("-" + vout.value), 
            time:transaction.time,
            blockHeight: block.height,
            blockHash: block.hash
        };


        transactionData.dbAddressTxs.push(tx);

        transactionData.dbTransaction.vin.push(Object.assign({
            address: address,
            value: vout.value,
        },vin));


        var updateSpentTx = {
            _id: vinTransaction.txid + "-vout[" + vin.vout + "]",
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
            _id: transaction.txid + "-vout[" + transaction.vout.indexOf(vout) + "]",
            address: address,
            txid: transaction.txid,
            type: "vout",
            vout: transaction.vout.indexOf(vout),
            value: new Big(vout.value),
            time:transaction.time,
            blockHeight: block.height,
            blockHash: block.hash,
            spent: false
        };

        if (transaction.vin[0].coinbase != null){
            var outValue = new Big(0);
            transaction.vout.forEach(vout => outValue = outValue.add(new Big(vout.value))); 


            if (new Big(vout.value).lt(outValue.div(new Big(2)))){ 
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


module.exports = IndexerService;