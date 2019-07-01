var MongoClient = require('mongodb').MongoClient;
var mongodbDecimal = require('mongodb').Decimal128;

var Big = require('big.js');





module.exports = function(url) {

    this._url = url;
    this._db = null;
    this._dbo = null;
    this._blocksCollection = null;
    this._transactionsCollection = null;
    this._addressesCollection = null;
    this._addressTxsCollection = null;
    this._opReturnsCollection = null;
    this._masternodesCollection = null;
    this._masternodeEventsCollection = null;


    this._connectPromise = null;

    this.connect = () =>{
        if (this._connectPromise == null) this._connectPromise = new Promise((resolve,reject) =>
        {
            MongoClient.connect(url, (err, db)  =>{
                if (err) throw err;
        
                _db = db;
                _dbo = db.db("mydb");
                var createBlocksPromise = _dbo.createCollection("blocks");
                var createTransactionsPromise = _dbo.createCollection("transactions");
                var createAddressesPromise = _dbo.createCollection("addresses");
                var createAddressTxsPromise = _dbo.createCollection("addressTxs");
                var createOpReturnsPromise = _dbo.createCollection("opReturns");
        
                var createMasternodesPromise = _dbo.createCollection("masternodes");
                var createMasternodeEventsPromise = _dbo.createCollection("masternodeEvents");
            
                createBlocksPromise.then((blocksCollection) => {
                    this._blocksCollection = blocksCollection;
                    return Promise.all([this._blocksCollection.createIndex({hash:1}),this._blocksCollection.createIndex({date:1})]);
                });
            
            
                createTransactionsPromise.then((transactionsCollection) => {
                    this._transactionsCollection = transactionsCollection;
                });
                
                createAddressesPromise.then((addressesCollection)  =>{
                    this._addressesCollection = addressesCollection;
        
                    var lastAcitivityIndex = this._addressesCollection.createIndex({lastActivity:1, balance: 1});
                    var richListIndexPromise = this._addressesCollection.createIndex({balance: -1, time:1});
                    //create dormant index
                    return Promise.all([lastAcitivityIndex,richListIndexPromise]);
                });
        
                createAddressTxsPromise.then((addressTxsCollection) => {
                    this._addressTxsCollection = addressTxsCollection;
        
                    var addressTxIndexPromise = this._addressTxsCollection.createIndex({address:1, type:1});
                    var addressTxComputeIndexPromise = this._addressTxsCollection.createIndex({address:1, blockHeight:1, type:1 });
                    var getAddressTxIndexPromise = this._addressTxsCollection.createIndex({address:1, time:1});
                    var addressTxPayoutsIndexPromise = this._addressTxsCollection.createIndex({address:1, payout:1, time:1 }, { partialFilterExpression: { payout: { $in: ["masternode","miner"] } } });
                    //var addressUnspentTxIndexPromise = this._addressTxsCollection.createIndex({address:1, time:1}, { name: "addressUnspentTxIndex", partialFilterExpression: { spent: { $eq: false }, type: { $eq: "vout" } } });
                    
                    return Promise.all([addressTxIndexPromise,getAddressTxIndexPromise,addressTxComputeIndexPromise,addressTxPayoutsIndexPromise]); 
                });
        
        
                createOpReturnsPromise.then((opReturnsCollection) => {
                    this._opReturnsCollection = opReturnsCollection;
        
                    return this._opReturnsCollection.createIndex({time:1});
                });
        
                createMasternodesPromise.then((masternodesCollection) => {
                    this._masternodesCollection = masternodesCollection;
                    return this._masternodesCollection.createIndex({output:1, time:1});
                });
                
        
                createMasternodeEventsPromise.then((masternodeEventsCollection) => {
                    this._masternodeEventsCollection = masternodeEventsCollection;
                });
            
                Promise.all([
                    createBlocksPromise,
                    createTransactionsPromise,
                    createAddressesPromise, 
                    createAddressTxsPromise, 
                    createOpReturnsPromise, 
                    createMasternodesPromise, 
                    createMasternodeEventsPromise
                ]).then(function(){
                    resolve();
                }).catch(reject);
            
            });
        
        });



        return this._connectPromise;
    }


    this.disconnect = () =>{

        return new Promise((resolve, reject) =>
        {
            _db.close(false,function(err){
                if (err == null) resolve();
                else reject(err);
            });
        }).then(() => {
            this._connectPromise = null;
        });
        
    }




   
    this.getMasternode = (output) => {
        return this.connect().then(() => this._masternodeEventsCollection.find({"output": output}).count().then(eventCount => {
            return {
                eventCount: eventCount
            }
        }));
    };

    this.saveMasternodeEvent = (masternodeEvent) => {

        return this.connect().then(() => new Promise((resolve, reject) =>
        {
            this._masternodeEventsCollection.insert(masternodeEvent,function(err){
                if (err == null) resolve();
                else reject(err);
            });
        }));    
    };
    
    this.getMasternodeEvent = (output,pos) =>{
        return this.connect().then(() => _masternodeEventsCollection.find({"output": output}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 ).toArray().then((items) => items[0]));
    };

    this.saveAddressTxs = (addressTxs) => {
        return this.connect().then(() => new Promise((resolve, reject) =>
        {
            var bulk = this._addressTxsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < addressTxs.length; i++)
            {
                bulk.find({_id:addressTxs[i]._id}).upsert().updateOne(addressTxs[i]);
            }
            
            bulk.execute((err,result)  => {
    
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
            
        }));
    }

    this.saveSpendAddressTxs = (spendAddressTxs) => {
        return this.connect().then(() => new Promise((resolve, reject)  => 
        {
            var bulk = this._addressTxsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < spendAddressTxs.length; i++)
            {
                bulk.find({_id:spendAddressTxs[i]._id}).updateOne({
                    $set: {
                        spent : true
                    }
                });
            }
            
            bulk.execute((err,result)  => {
    
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
            
        }));
    
    };


    this.getCalculateAddresses = async function(addressIds, blockHeight){

    

        var pipelines = [{ 
            $match: {
                "address": {
                    "$in" : addressIds
                }
            }
        }];
    
        if (blockHeight != null)
        {
            pipelines.push({ 
                $match: {
                    "blockHeight": { 
                        $lte :blockHeight
                    }
                }
            });   
        }
        pipelines.push({ 
            $group: {
              _id: {
                "address": "$address",
                "type": "$type"
              }, 
              value: {
                $sum: "$value"
              },
              lastActivity:{
                $max: "$time"
              },
              count:{
                  $sum: 1
              }
            }
        });
    
        await this.connect();
        var cursor = await this._addressTxsCollection.aggregate(pipelines);
        var results = await cursor.toArray();
    
    
        var addresses = [];
    
        for(var i = 0; i < addressIds.length; i++)
        {
            var addressId = addressIds[i];
            var address = {
                address:  addressId,
                received: null, //
                sent: null,
                txCount: 0,
                lastActivity: 0
            };
            addresses.push(address);
    
            var voutBalance = null;
            var vinBalance = null;

            var sent = new Big("0");
            var received = new Big("0");;
            
    
            results.forEach(function(balance){
                if (balance._id.type == "vout" && balance._id.address == address.address) voutBalance = balance;
                else if (balance._id.type == "vin" && balance._id.address == address.address) vinBalance = balance;
            });
    
            if (vinBalance != null)
            {
                send = new Big("0").minus(new Big(vinBalance.value.toString()));
                address.txCount = address.txCount + vinBalance.count;
                if (address.lastActivity < vinBalance.lastActivity) address.lastActivity = vinBalance.lastActivity;
            }

    
            if (voutBalance != null)
            {
                received = new Big(voutBalance.value.toString());
                address.txCount = address.txCount + voutBalance.count;
                if (address.lastActivity < voutBalance.lastActivity) address.lastActivity = voutBalance.lastActivity;
            }

    
            address.balance = mongodbDecimal.fromString(received.minus(sent).toString());
            address.received = mongodbDecimal.fromString(received.toString())
            address.sent = mongodbDecimal.fromString(sent.toString())
        }
        return addresses;
    };

    this.saveAddresses = async (addresses) => {
        return this.connect().then(() =>new Promise((resolve, reject) => 
        {
            var bulk = this._addressesCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < addresses.length; i++)
            {
                bulk.find({_id:addresses[i]._id}).upsert().updateOne(addresses[i]);
            }
            
            bulk.execute(function(err,result) {
    
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
        }));
    };

    this.saveTransactions = (transactions) =>{
        return this.connect().then(() => new Promise((resolve, reject) => 
        {
            var bulk = this._transactionsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < transactions.length; i++)
            {
                bulk.find({_id:transactions[i]._id}).upsert().updateOne(transactions[i]);
            }
            
            bulk.execute(function(err,result) {
    
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
            
        }));
    
    };

    this.saveBlocks = (blocks) => {
        return this.connect().then(() => new Promise((resolve, reject) =>
        {
            var bulk = this._blocksCollection.initializeOrderedBulkOp();
    
            for(var i = 0; i < blocks.length; i++)
            {
                bulk.find({_id:blocks[i]._id}).upsert().updateOne(blocks[i]);
            }
            
            bulk.execute(function(err,result) {
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
            
        }));
    
    }

    this.getTopBlock = () =>{
        return this.connect().then(() => this._blocksCollection.find().sort({_id : -1}).limit(1).toArray().then(data => data[0]));
    }

    this.getBlock = (hash) => {
        return  this.connect().then(() => this._blocksCollection.findOne({"hash":hash}))
    }

    this.getTransaction = (txid) => {
        return  this.connect().then(() => this._transactionsCollection.findOne({"_id":txid}))
    }

    this.getAddress = (address) => {
        return  this.connect().then(() => this._addressesCollection.findOne({_id: address}))
    }

    this.getAddressTx = (address, pos) => {
        return  this.connect().then(() => {
            var cusor = _addressTxsCollection.find({"address": address}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );

            return cusor.toArray().then(function(items){
                return items[0];
            });
        });
    }

    this.getAddressUnspent = (address) => {
        return  this.connect().then(() => {
            var cusor = _addressTxsCollection.find({"address": address, type:"vout",spent: false}).sort( { time: 1 } );

            return cusor.toArray().then(function(items){
                return items.reverse();
            });
        });
    }
}