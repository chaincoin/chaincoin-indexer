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




   
    this.getMasternode = (outputId) => {
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