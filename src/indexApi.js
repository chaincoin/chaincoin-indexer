var MongoClient = require('mongodb').MongoClient;
var mongodbDecimal = require('mongodb').Decimal128;

var url =  process.env.MONGODBURL || "mongodb://localhost:27017/";






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
        if (this._connectPromise == null) this._connectPromise = new Promise(function(resolve,reject)
        {
            MongoClient.connect(url, function(err, db) {
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
            
                createBlocksPromise.then(function(blocksCollection){
                    this._blocksCollection = blocksCollection;
                    return Promise.all([_blocksCollection.createIndex({hash:1}),_blocksCollection.createIndex({date:1})]);
                });
            
            
                createTransactionsPromise.then(function(transactionsCollection){
                    this._transactionsCollection = transactionsCollection;
                });
                
                createAddressesPromise.then(function(addressesCollection){
                    this._addressesCollection = addressesCollection;
        
                    var lastAcitivityIndex = _addressesCollection.createIndex({lastActivity:1, balance: 1});
                    var richListIndexPromise = _addressesCollection.createIndex({balance: -1, time:1});
                    //create dormant index
                    return Promise.all([lastAcitivityIndex,richListIndexPromise]);
                });
        
                createAddressTxsPromise.then(function(addressTxsCollection){
                    this._addressTxsCollection = addressTxsCollection;
        
                    var addressTxIndexPromise = _addressTxsCollection.createIndex({address:1, type:1});
                    var addressTxComputeIndexPromise = _addressTxsCollection.createIndex({address:1, blockHeight:1, type:1 });
                    var getAddressTxIndexPromise = _addressTxsCollection.createIndex({address:1, time:1});
                    var addressTxPayoutsIndexPromise = _addressTxsCollection.createIndex({address:1, payout:1, time:1 }, { partialFilterExpression: { payout: { $in: ["masternode","miner"] } } });
                    //var addressUnspentTxIndexPromise = _addressTxsCollection.createIndex({address:1, time:1}, { name: "addressUnspentTxIndex", partialFilterExpression: { spent: { $eq: false }, type: { $eq: "vout" } } });
                    
                    return Promise.all([addressTxIndexPromise,getAddressTxIndexPromise,addressTxComputeIndexPromise,addressTxPayoutsIndexPromise]); 
                });
        
        
                createOpReturnsPromise.then(function(opReturnsCollection){
                    this._opReturnsCollection = opReturnsCollection;
        
                    return _opReturnsCollection.createIndex({time:1});
                });
        
                createMasternodesPromise.then(function(masternodesCollection){
                    this._masternodesCollection = masternodesCollection;
                    return _masternodesCollection.createIndex({output:1, time:1});
                });
                
        
                createMasternodeEventsPromise.then(function(masternodeEventsCollection){
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


    this.disconnect = function(){

        return new Promise(function(resolve, reject)
        {
            _db.close(false,function(err){
                if (err == null) resolve();
                else reject(err);
            });
        }).then(() => {
            this._connectPromise = null;
        });
        
    }




   
    this.getMasternode = function(outputId){
        return this._masternodeEventsCollection.find({"output": output}).count().then(eventCount => {
            eventCount: eventCount
        });

    };

    this.saveMasternodeEvent = (masternodeEvent) => {
        return new Promise((resolve, reject) =>
        {
            this._masternodeEventsCollection.insert(masternodeEvent,function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
    
    };
    
    this.getMasternodeEvent = (output,pos) =>{
        var cusor = _masternodeEventsCollection.find({"output": output}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );
    
        return cusor.toArray().then((items) => items[0]);
    };
}