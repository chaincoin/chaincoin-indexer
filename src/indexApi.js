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


                var createBlockSubscriptionsPromise = _dbo.createCollection("blockSubscriptions").then((blockSubscriptions) =>{
                    this._blockSubscriptions = blockSubscriptions;
                    return Promise.all([this._blockSubscriptions.createIndex({firebaseId:1})]);
                });

                var createAddressSubscriptionsPromise = _dbo.createCollection("addressSubscriptions").then((addressSubscriptions) =>{
                    this._addressSubscriptions = addressSubscriptions;
                    return Promise.all([this._addressSubscriptions.createIndex({address:1}),this._addressSubscriptions.createIndex({firebaseId:1})]);
                });
            
            
                var createMasternodeSubscriptionsPromise = _dbo.createCollection("masternodeSubscriptions").then((masternodeSubscriptions) =>{
                    this._masternodeSubscriptions = masternodeSubscriptions;
                    return Promise.all([this._masternodeSubscriptions.createIndex({masternodeOutPoint:1}),this._masternodeSubscriptions.createIndex({firebaseId:1})]);
                });
            
                Promise.all([
                    createBlocksPromise,
                    createTransactionsPromise,
                    createAddressesPromise, 
                    createAddressTxsPromise, 
                    createOpReturnsPromise, 
                    createMasternodesPromise, 
                    createMasternodeEventsPromise,
                    createBlockSubscriptionsPromise,
                    createAddressSubscriptionsPromise,
                    createMasternodeSubscriptionsPromise
                ]).then(() => {
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

    this.getMasternodeEvents = function(output,pos,pageSize){
        return this.connect().then(() => {
            if (pos != null) pos = parseInt(pos);
            if (pageSize != null) pageSize = parseInt(pageSize);
        
            if (pageSize == null) pageSize = 10;
            if (pageSize > 200) pageSize = 200;
        
            var cusor = this._masternodeEventsCollection.find({"output": output}).sort( { time: 1 } ).skip(pos - pageSize).limit( pageSize );
        
            return cusor.toArray().then(function(items){
                return items.reverse();
            });
        });
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

    this.deleteAddressTxs = (addressTxIds) => {
        return this.connect().then(() => new Promise((resolve, reject) =>
        {
            var bulk = this._addressTxsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < addressTxIds.length; i++)
            {
                bulk.find({_id:addressTxIds[i]}).remove();
            }
            
            bulk.execute((err,result)  => {
    
                if (err == null && result.isOk()) resolve();
                else reject(err);
             
            });
            
        }));
    }

    this.saveSpendAddressTxs = (spendAddressTxs, spent) => {
        return this.connect().then(() => new Promise((resolve, reject)  => 
        {
            var bulk = this._addressTxsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < spendAddressTxs.length; i++)
            {
                bulk.find({_id:spendAddressTxs[i]._id}).updateOne({
                    $set: {
                        spent : spent
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
                sent = new Big("0").minus(new Big(vinBalance.value.toString()));
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
                bulk.find({_id:addresses[i]._id}).upsert().updateOne({$set:addresses[i]});
            }
            
            bulk.execute(function(err,result) {
    
                if (err == null && result.isOk()) resolve(result);
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
    
                if (err == null && result.isOk()) resolve(result);
                else reject(err);
             
            });
            
        }));
    
    };

    this.deleteTransactions = (transactionIds) =>{
        return this.connect().then(() => new Promise((resolve, reject) => 
        {
            var bulk = this._transactionsCollection.initializeUnorderedBulkOp();
    
            for(var i = 0; i < transactionIds.length; i++)
            {
                bulk.find({_id:transactionIds[i]}).remove();
            }
            
            bulk.execute(function(err,result) {
    
                if (err == null && result.isOk()) resolve(result);
                else reject(err);
             
            });
            
        }));
    
    };

    this.insertTransaction = (txid, transaction) =>{
        return this.connect().then(() => new Promise((resolve, reject) => 
        {
            var bulk = this._transactionsCollection.initializeUnorderedBulkOp();
    
            bulk.find({_id:txid}).upsert().updateOne({
                "$setOnInsert": transaction
            });
            
            bulk.execute(function(err,result) {
    
                if (err == null && result.isOk()) resolve(result);
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

    this.deleteBlocks = (blockIds) => {
        return this.connect().then(() => new Promise((resolve, reject) =>
        {
            var bulk = this._blocksCollection.initializeOrderedBulkOp();
    
            for(var i = 0; i < blockIds.length; i++)
            {
                bulk.find({_id:blockIds[i]}).remove();
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
            var cusor = this._addressTxsCollection.find({"address": address}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );

            return cusor.toArray().then(function(items){
                return items[0];
            });
        });
    }

    this.getAddressTxs = (address,pos,pageSize) => {
        return  this.connect().then(() => {
            var cusor = this._addressTxsCollection.find({"address": address}).sort( { time: 1 } ).skip(pos - pageSize).limit( pageSize );
        
            return cusor.toArray().then(function(items){
                return items.reverse();
            });
        });
    };
    
    

    this.getAddressUnspent = (address) => {
        return  this.connect().then(() => {
            var cusor = this._addressTxsCollection.find({"address": address, type:"vout",spent: false}).sort( { time: 1 } );

            return cusor.toArray().then(function(items){
                return items.reverse();
            });
        });
    }


    this.getRichListCount = () =>{
        return  this.connect().then(() =>this._addressesCollection.countDocuments());
    };

    this.getRichList = (pos,pageSize) => {
        return this.connect().then(() =>{
            var cusor = this._addressesCollection.find().sort( { balance: -1, time:1 } ).skip(pos).limit( pageSize );
            return cusor.toArray();
        });
        
    };


    this.getPayoutsStats = (address, type, unit) => {
	
        return this.connect().then(() =>{
            var id = null;
            var sort = null;
            
            if (unit == "daily")
            {
                id = {
                    'year': { '$year': "$date" },
                    'month': { '$month': "$date" },
                    'day': { '$dayOfMonth': "$date" }
                };
                
                sort = {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.day': 1,
                };
            }
            else if (unit == "weekly")
            {
                id = {
                    'year': { '$year': "$date" },
                    'week': { '$week': "$date" }
                }
                
                sort = {
                    '_id.year': 1,
                    '_id.week': 1
                };
            }
            else if (unit == "monthly")
            {
                id = {
                    'year': { '$year': "$date" },
                    'month': { '$month': "$date" }
                }
                
                sort = {
                    '_id.year': 1,
                    '_id.month': 1
                };
            }
            else if (unit == "yearly")
            {
                id = {
                    'year': { '$year': "$date" }
                }
                
                sort = {
                    '_id.year': 1
                };
            }
            
            
            return new Promise((resolve,reject) =>{
                this._addressTxsCollection.aggregate(
                [ 
                    { $match: 
                        {
                            "address": address,
                            "payout": type
                        }
                    }, 
                    {
                        $project: {
                            time: {
                                $multiply : ["$time",  1000 ]
                            },
                            value: true
                        }
                    },
                    {
                        $project: {
                            date: {
                                $toDate : "$time"
                            },
                            value: true
                        }
                    },
                    { 
                    $group: {
                        _id: id, 
                        value: {
                        $sum: "$value"
                        },
                        count:{
                            $sum: 1
                        }
                    }
                    },
                    {
                        $sort: sort
                    },
                ], function(err, items){
                    var result = items.toArray();
                    resolve(result);
                });
            });
        });
    }


    this.deleteSubscriptions = async (firebaseId) =>
    {
        
        await new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.deleteOne({_id: firebaseId},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        await new Promise((resolve, reject) =>
        {
            this._masternodeSubscriptions.deleteMany({firebaseId: firebaseId},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        await new Promise((resolve, reject) =>
        {
            this._addressSubscriptions.deleteMany({firebaseId: firebaseId},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
    };



    this.updateSubscriptions = (oldFirebaseId, newFirebaseId) =>
    {
        
        var blockSubscriptionssPromise = new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.deleteOne({_id: oldFirebaseId},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        var blockSubscriptionsPromise = new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.update({_id: newFirebaseId}, {_id: newFirebaseId}, { upsert: true, safe: true },function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        
        var masternodeSubscriptionsPromise = new Promise((resolve, reject) => 
        {
            this._masternodeSubscriptions.updateMany({firebaseId: oldFirebaseId}, { $set : {firebaseId : newFirebaseId } },function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        var addressSubscriptionsPromise = new Promise((resolve, reject) =>
        {
            this._addressSubscriptions.updateMany({firebaseId: oldFirebaseId}, { $set : {firebaseId : newFirebaseId } },function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
        
        return Promise.all([
            blockSubscriptionssPromise,
            blockSubscriptionsPromise,
            masternodeSubscriptionsPromise,
            addressSubscriptionsPromise
        ]).then(() => {});
    };


    this.saveBlockSubscription = (firebaseId) =>
    {
        var entity = {
            firebaseId: firebaseId
        };

        return new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.update({_id: firebaseId}, entity, { upsert: true, safe: true },function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
    };


    this.deleteBlockSubscription = (firebaseId) =>
    {
        return new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.deleteOne({_id: firebaseId},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });

    };


    this.isBlockSubscription = (firebaseId) =>
    { 
        return new Promise((resolve, reject) =>
        {
            this._blockSubscriptions.findOne({_id: firebaseId},function(err,result){
                if (err == null) resolve(result != null);
                else reject(err);
            });
        });

    };

    this.saveMasternodeSubscription = (firebaseId, masternodeOutpoint) =>
    {
        var entity = {
            firebaseId: firebaseId,
            masternodeOutpoint: masternodeOutpoint
        };

        return new Promise((resolve, reject) =>
        {
            this._masternodeSubscriptions.update({_id: firebaseId + "-" + masternodeOutpoint}, entity, { upsert: true, safe: true },function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });
    };


    this.deleteMasternodeSubscription =  (firebaseId, masternodeOutpoint) =>
    {
        return new Promise((resolve, reject) =>
        {
            this._masternodeSubscriptions.deleteOne({_id: firebaseId + "-" + masternodeOutpoint},function(err){
                if (err == null) resolve();
                else reject(err);
            });
        });

    };

    this.isMasternodeSubscription = (firebaseId, masternodeOutpoint) =>
    { 
        return this.connect().then(() =>{
            return new Promise((resolve, reject) =>
            {
                this._masternodeSubscriptions.findOne({_id: firebaseId + "-" + masternodeOutpoint},function(err,result){
                    if (err == null) resolve(result != null);
                    else reject(err);
                });
            });
        });

    };


    this.saveAddressSubscription = (firebaseId, address) =>
    {
        var entity = {
            firebaseId: firebaseId,
            address: address
        };

        return this.connect().then(() =>{
            return new Promise((resolve, reject) =>
            {
                this._addressSubscriptions.update({_id: firebaseId + "-" + address}, entity, { upsert: true, safe: true },function(err){
                    if (err == null) resolve();
                    else reject(err);
                });
            });
        });
    };


    this.deleteAddressSubscription = (firebaseId, address) =>
    {
        return this.connect().then(() =>{
            return new Promise((resolve, reject) =>
            {
                this._addressSubscriptions.deleteOne({_id: firebaseId + "-" + address},function(err){
                    if (err == null) resolve();
                    else reject(err);
                });
            });
        });
    };

    this.isAddressSubscription = (firebaseId, address) =>
    { 
        return this.connect().then(() =>{
            return new Promise((resolve, reject) =>
            {
                this._addressSubscriptions.findOne({_id: firebaseId + "-" + address},function(err,result){
                    if (err == null) resolve(result != null);
                    else reject(err);
                });
            });
        });
    };


    this.getBlockSubscriptions = () =>{
        return this.connect().then(() =>{
            var cusor = this._blockSubscriptions.find();
            return cusor.toArray().then(function(items){
                return items;
            });
        });
    }

    this.getMasternodeSubscriptions = (masternodeOutpoint) => {
        return this.connect().then(() =>{
            var cusor = this._masternodeSubscriptions.find({masternodeOutpoint:masternodeOutpoint});
            return cusor.toArray().then((items) => {
                return items;
            });
        });
    }

    this.getAddressSubscriptions = (address) =>{
        return this.connect().then(() =>{
            var cusor = this._addressSubscriptions.find({address:address});
            return cusor.toArray().then(function(items){
                return items;
            });
        });
    }
}