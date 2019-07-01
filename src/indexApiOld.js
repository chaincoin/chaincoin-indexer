var MongoClient = require('mongodb').MongoClient;
var mongodbDecimal = require('mongodb').Decimal128;

var url =  process.env.MONGODBURL || "mongodb://localhost:27017/";



var _db = null;
var _dbo = null;
var _blocksCollection = null;
var _transactionsCollection = null;
var _addressesCollection = null;
var _addressTxsCollection = null;
var _opReturnsCollection = null;
var _masternodesCollection = null;
var _masternodeEventsCollection = null;

module.exports.connect = new Promise(function(resolve,reject)
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
            _blocksCollection = blocksCollection;
            return Promise.all([_blocksCollection.createIndex({hash:1}),_blocksCollection.createIndex({date:1})]);
        });
    
    
        createTransactionsPromise.then(function(transactionsCollection){
            _transactionsCollection = transactionsCollection;
        });
        
        createAddressesPromise.then(function(addressesCollection){
            _addressesCollection = addressesCollection;

            var lastAcitivityIndex = _addressesCollection.createIndex({lastActivity:1, balance: 1});
            var richListIndexPromise = _addressesCollection.createIndex({balance: -1, time:1});
            //create dormant index
            return Promise.all([lastAcitivityIndex,richListIndexPromise]);
        });

        createAddressTxsPromise.then(function(addressTxsCollection){
            _addressTxsCollection = addressTxsCollection;

            var addressTxIndexPromise = _addressTxsCollection.createIndex({address:1, type:1});
            var addressTxComputeIndexPromise = _addressTxsCollection.createIndex({address:1, blockHeight:1, type:1 });
            var getAddressTxIndexPromise = _addressTxsCollection.createIndex({address:1, time:1});
			var addressTxPayoutsIndexPromise = _addressTxsCollection.createIndex({address:1, payout:1, time:1 }, { partialFilterExpression: { payout: { $in: ["masternode","miner"] } } });
			//var addressUnspentTxIndexPromise = _addressTxsCollection.createIndex({address:1, time:1}, { name: "addressUnspentTxIndex", partialFilterExpression: { spent: { $eq: false }, type: { $eq: "vout" } } });
            
            return Promise.all([addressTxIndexPromise,getAddressTxIndexPromise,addressTxComputeIndexPromise,addressTxPayoutsIndexPromise]); 
        });


        createOpReturnsPromise.then(function(opReturnsCollection){
            _opReturnsCollection = opReturnsCollection;

            return _opReturnsCollection.createIndex({time:1});
        });

        createMasternodesPromise.then(function(masternodesCollection){
            _masternodesCollection = masternodesCollection;
			return _masternodesCollection.createIndex({output:1, time:1});
        });
        

		createMasternodeEventsPromise.then(function(masternodeEventsCollection){
            _masternodeEventsCollection = masternodeEventsCollection;
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


module.exports.disconnect = function(){

    return new Promise(function(resolve, reject)
    {
        _db.close(false,function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
    
}


module.exports.saveMasternode = function(outputId, masternode){
    return new Promise(function(resolve, reject)
    {
        _masternodesCollection.update({_id: outputId}, masternode, { upsert: true,safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
};

module.exports.getMasternode = function(outputId){
    return _masternodesCollection.findOne({"_id":outputId});
};

module.exports.getMasternodes = function(){

    var cusor = _masternodesCollection.find({});
    return cusor.toArray().then(function(items){
        return items;
    });
};



module.exports.calculateMasternode = async function(output){
    var eventCount = await _masternodeEventsCollection.find({"output": output}).count();
	return {
		eventCount: eventCount
	};
};


module.exports.saveTransaction = function(transaction)
{
    return new Promise(function(resolve, reject)
    {
         _transactionsCollection.update({_id: transaction._id}, transaction, { upsert: true, safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
}

module.exports.saveTransactions = function(transactions){
    return new Promise(function(resolve, reject)
    {
        var bulk = _transactionsCollection.initializeUnorderedBulkOp();

        for(var i = 0; i < transactions.length; i++)
        {
            bulk.find({_id:transactions[i]._id}).upsert().updateOne(transactions[i]);
        }
        
        bulk.execute(function(err,result) {

            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
        
    });

};


module.exports.saveBlock = function(block){

    return new Promise(function(resolve, reject)
    {
        _blocksCollection.update({_id: block._id}, block, { upsert: true,safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
};

module.exports.saveBlocks = function(blocks){
    return new Promise(function(resolve, reject)
    {
        var bulk = _blocksCollection.initializeOrderedBulkOp();

        for(var i = 0; i < blocks.length; i++)
        {
            bulk.find({_id:blocks[i]._id}).upsert().updateOne(blocks[i]);
        }
        
        bulk.execute(function(err,result) {
            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
        
    });

};


module.exports.saveAddressName = function(address, name){
    return new Promise(function(resolve, reject)
    {
        var updateRequest = {
            $set:{
                name:name
            }
        }

        _addressesCollection.update({_id: address}, updateRequest, {  },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
};


module.exports.saveAddress = function(address){
    return new Promise(function(resolve, reject)
    {
        _addressesCollection.update({_id: address._id}, address, { upsert: true,safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
};


module.exports.saveAddress = function(address){
    return new Promise(function(resolve, reject)
    {
        _addressesCollection.update({_id: address._id}, address, { upsert: true,safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });
};


module.exports.saveAddresses = async function(addresses){
    return new Promise(function(resolve, reject)
    {
        var bulk = _addressesCollection.initializeUnorderedBulkOp();

        for(var i = 0; i < addresses.length; i++)
        {
            bulk.find({_id:addresses[i]._id}).upsert().updateOne(addresses[i]);
        }
        
        bulk.execute(function(err,result) {

            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
    });
};


module.exports.saveAddressTx = function(addressTx){
    return new Promise(function(resolve, reject)
    {
        _addressTxsCollection.update({_id: addressTx._id}, addressTx, { upsert: true, safe: true },function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });

};


module.exports.saveMasternodeEvent = function(masternodeEvent){
    return new Promise(function(resolve, reject)
    {
        _masternodeEventsCollection.insert(masternodeEvent,function(err){
            if (err == null) resolve();
            else reject(err);
        });
    });

};

module.exports.getMasternodeEvent = function(output,pos){
    var cusor = _masternodeEventsCollection.find({"output": output}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );

    return cusor.toArray().then(function(items){
        return items[0];
    });
};


module.exports.getMasternodeEvents = function(output,pos,pageSize){

    if (pos != null) pos = parseInt(pos);
    if (pageSize != null) pageSize = parseInt(pageSize);

    if (pageSize == null) pageSize = 10;
    if (pageSize > 200) pageSize = 200;

    var cusor = _masternodeEventsCollection.find({"output": output}).sort( { time: 1 } ).skip(pos - pageSize).limit( pageSize );

    return cusor.toArray().then(function(items){
        return items.reverse();
    });

};


module.exports.saveAddressTxs = function(addressTxs){
    return new Promise(function(resolve, reject)
    {
        var bulk = _addressTxsCollection.initializeUnorderedBulkOp();

        for(var i = 0; i < addressTxs.length; i++)
        {
            bulk.find({_id:addressTxs[i]._id}).upsert().updateOne(addressTxs[i]);
        }
        
        bulk.execute(function(err,result) {

            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
        
    });

};


module.exports.saveSpendAddressTxs = function(spendAddressTxs){
    return new Promise(function(resolve, reject)
    {
        var bulk = _addressTxsCollection.initializeUnorderedBulkOp();

        for(var i = 0; i < spendAddressTxs.length; i++)
        {
            bulk.find({_id:spendAddressTxs[i]._id}).updateOne({
				$set: {
					spent : true
				}
			});
        }
        
        bulk.execute(function(err,result) {

            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
        
    });

};


module.exports.getOpReturnCount = function(){
    return  _opReturnsCollection.count();
};

module.exports.getOpReturn = function(address,pos){
    var cusor = _opReturnsCollection.find().sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );

    return cusor.toArray().then(function(items){
        return items[0];
    });
};


module.exports.getOpReturns = function(pos,pageSize){

    if (pos != null) pos = parseInt(pos);
    if (pageSize != null) pageSize = parseInt(pageSize);

    if (pageSize == null) pageSize = 10;
    if (pageSize > 200) pageSize = 200;

    var cusor = _opReturnsCollection.find().sort( { time: 1 } ).skip(pos - pageSize).limit( pageSize );

    return cusor.toArray().then(function(items){
        return items.reverse();
    });

};


module.exports.getOpReturnSummary = async function(){

    
    var cursor = _opReturnsCollection.aggregate([
        
        {
            $project: {
                value: {
                    $multiply : ["$value", 1000000000 ]
                }
            }
        },
        {
            $group:{
                _id: '',
                count: { $sum: 1 },
                total: { $sum: "$value" }
            }
        },
        { 
            $project: {
                count:1,
                total: {
                    $divide : ["$total", 1000000000 ]
                }
            }
        }
        
    ]);

    var results = await cursor.toArray();
    return results[0];
};

module.exports.saveOpReturns = function(opReturns){
    return new Promise(function(resolve, reject)
    {
        var bulk = _opReturnsCollection.initializeUnorderedBulkOp();

        for(var i = 0; i < opReturns.length; i++)
        {
            bulk.find({_id:opReturns[i]._id}).upsert().updateOne(opReturns[i]);
        }
        
        bulk.execute(function(err,result) {

            if (err == null && result.isOk()) resolve();
            else reject(err);
         
        });
        
    });

};


module.exports.getHashRateStats = function(unit){
	
	
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
	
	
    return new Promise(function(resolve,reject){
        _blocksCollection.aggregate(
		[ 
			{ 
			  $group: {
				_id: id, 
				hashRate: {
				  $avg: "$hashRate"
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
};

module.exports.getPayoutsStats = function(address, type, unit){
	
	
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
	
	
    return new Promise(function(resolve,reject){
        _addressTxsCollection.aggregate(
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
};


module.exports.calculateAddressBalance = function(address){
    return new Promise(function(resolve,reject){
        _addressTxsCollection.aggregate(
		[ 
			{ $match: {"address": address}}, 
			{ 
			  $group: {
				_id: "$type", 
				value: {
				  $sum: "$value"
				},
				count:{
					$sum: 1
				}
			  }
			}
		], function(err, items){
            var result = items.toArray();
            resolve(result);
          });
    });
};



module.exports.getCalculateAddress = async function(addressId, blockHeight){

    

    var pipelines = [{ $match: {"address": addressId}}];

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
          _id: "$type", 
          lastActivity:{
            $max: "$time"
          },
          value: {
            $sum: "$value"
          },
          count:{
              $sum: 1
          }
        }
    });



    var cursor = _addressTxsCollection.aggregate(pipelines);
    var results = await cursor.toArray();


    var voutBalance = null;
    var vinBalance = null;

    results.forEach(function(balance){
        if (balance._id == "vout") voutBalance = balance;
        else if (balance._id == "vin") vinBalance = balance;
    });

    var address = {
        address:  addressId,
    };

    address.txCount = 0;
    address.lastActivity = 0;

    if (vinBalance != null)
    {
        address.sent = mongodbDecimal.fromString("0") - vinBalance.value;
        address.txCount = address.txCount + vinBalance.count;
        if (address.lastActivity < vinBalance.lastActivity) address.lastActivity = vinBalance.lastActivity;
    }
    else
    {
        address.sent = mongodbDecimal.fromString("0");
    }

    if (voutBalance != null)
    {
        address.received = voutBalance.value;
        address.txCount = address.txCount + voutBalance.count;
        if (address.lastActivity < voutBalance.lastActivity) address.lastActivity = voutBalance.lastActivity;
    }
    else
    {
        address.received = mongodbDecimal.fromString("0");
    }


    address.balance = address.received - address.sent;

    return address;
};

module.exports.getCalculateAddresses = async function(addressIds, blockHeight){

    

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


    var cursor = await _addressTxsCollection.aggregate(pipelines);
    var results = await cursor.toArray();


    var addresses = [];

    for(var i = 0; i < addressIds.length; i++)
    {
        var addressId = addressIds[i];
        var address = {
            address:  addressId,
            received: mongodbDecimal.fromString("0"),
            sent: mongodbDecimal.fromString("0"),
            txCount: 0,
            lastActivity: 0
        };
        addresses.push(address);

        var voutBalance = null;
        var vinBalance = null;

        results.forEach(function(balance){
            if (balance._id.type == "vout" && balance._id.address == address.address) voutBalance = balance;
            else if (balance._id.type == "vin" && balance._id.address == address.address) vinBalance = balance;
        });

        if (vinBalance != null)
        {
            address.sent = mongodbDecimal.fromString("0") - vinBalance.value;
            address.txCount = address.txCount + vinBalance.count;
            if (address.lastActivity < vinBalance.lastActivity) address.lastActivity = vinBalance.lastActivity;
        }
        else
        {
            address.sent = mongodbDecimal.fromString("0");
        }

        if (voutBalance != null)
        {
            address.received = voutBalance.value;
            address.txCount = address.txCount + voutBalance.count;
            if (address.lastActivity < voutBalance.lastActivity) address.lastActivity = voutBalance.lastActivity;
        }
        else
        {
            address.received = mongodbDecimal.fromString("0");
        }


        address.balance = address.received - address.sent;
    }


    
    return addresses;
};



module.exports.getBlockCount = function(){
    return _blocksCollection.count();
};



module.exports.getBlock = function(blockId){

    if (isNaN(blockId)) return _blocksCollection.findOne({"hash":blockId});

    return _blocksCollection.findOne({"_id":parseInt(blockId)});
};

module.exports.getBlocks = function(blockId, pageSize){

    if (blockId != null) blockId = parseInt(blockId);
    if (pageSize != null) pageSize = parseInt(pageSize);

    
    if (pageSize == null) pageSize = 10;
    if (pageSize > 100) pageSize = 100;
    //if (blockId == null) blockId = pageSize;

    var cusor = null;
    
    if (blockId != null)
    {
        var query = {
            $and:[
                {_id:{ $lte :blockId }},
                {_id:{ $gt :blockId - pageSize}}
            ]
        };

        cusor = _blocksCollection.find(query).sort( { _id: -1 } );
    }
    else
    {
        cusor = _blocksCollection.find().sort( { _id: -1 } ).limit(pageSize);
    }

    var promise = cusor.toArray().then(function(items){
        return items;
    });

    return promise;
};

module.exports.getTransaction = function(txid){
    return _transactionsCollection.findOne({_id:txid});
};


module.exports.getAddress = function(address, minConfirmations){
    return _addressesCollection.findOne({_id: address});
};


module.exports.getAddressTx = function(address,pos){
    var cusor = _addressTxsCollection.find({"address": address}).sort( { time: 1 } ).skip(parseInt(pos)).limit( 1 );

    return cusor.toArray().then(function(items){
        return items[0];
    });
};


module.exports.getAddressTxs = function(address,pos,pageSize){

    if (pos != null) pos = parseInt(pos);
    if (pageSize != null) pageSize = parseInt(pageSize);

    if (pageSize == null) pageSize = 10;
    if (pageSize > 200) pageSize = 200;

    var cusor = _addressTxsCollection.find({"address": address}).sort( { time: 1 } ).skip(pos - pageSize).limit( pageSize );

    return cusor.toArray().then(function(items){
        return items.reverse();
    });

};


module.exports.getAddressUnspent = function(address){

  
    var cusor = _addressTxsCollection.find({"address": address, type:"vout",spent: false}).sort( { time: 1 } );

    return cusor.toArray().then(function(items){
        return items.reverse();
    });

};



module.exports.getAddressCount = function(){
    return  _addressesCollection.count();
};


module.exports.getRichListCount = function(){
    return  _addressesCollection.count();
};

module.exports.getRichList = function(pos,pageSize){

    if (pos != null) pos = parseInt(pos);
    if (pageSize != null) pageSize = parseInt(pageSize);

    if (pageSize == null) pageSize = 10;
    if (pageSize > 100) pageSize = 100;

    var cusor = _addressesCollection.find().sort( { balance: -1, time:1 } ).skip(pos).limit( pageSize );

    return cusor.toArray();

};