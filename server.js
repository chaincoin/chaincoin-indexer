

var chaincoinApi = require('chaincoinApi');
var indexApi = require('indexApi');
var mongodbDecimal = require('mongodb').Decimal128;

var ChaincoinIndexerService = require("./ChaincoinIndexerService.js");


var zmq = require('zeromq');
var indexZmqSock = zmq.socket('pub');
indexZmqSock.bindSync("tcp://0.0.0.0:38833");

var chaincoinZmq = process.env.chaincoinZmq || "tcp://127.0.0.1:38832";


var express = require('express');
var app = express();


var start = async function()
{
    

    var indexer = new ChaincoinIndexerService(chaincoinApi,await indexApi.getBlockCount() + 1);
    indexer.blockDatasCallback = async function(blockDatas){
        
        
        //await indexApi.saveOpReturns(opReturns); //TODO: need to implement

        var dbAddressTxs = blockDatas.flatMap(blockData => blockData.transactionDatas.flatMap(transactionData => transactionData.dbAddressTxs));
        dbAddressTxs.forEach(dbAddressTx => dbAddressTx.value = mongodbDecimal.fromString(dbAddressTx.value.toString()));
        await indexApi.saveAddressTxs(dbAddressTxs);

        var dbAddressTxUpdates = blockDatas.flatMap(blockData => blockData.transactionDatas.flatMap(transactionData => transactionData.dbAddressTxUpdates));
        if (dbAddressTxUpdates.length > 0) await indexApi.saveSpendAddressTxs(dbAddressTxUpdates); //TODO: maybe i should be checking to see if the address tx is in the dbAddressTxs, if it is update it and filter out
        

        var addressIds = {};
        blockDatas.forEach(blockData => blockData.transactionDatas.forEach(transactionData => {
            addressIds = Object.assign(addressIds,transactionData.addresses);
        }));

        var addressSummaries = await indexApi.getCalculateAddresses(Object.keys(addressIds));
        addressSummaries.forEach(addressSummary => addressSummary._id = addressSummary.address)
        await indexApi.saveAddresses(addressSummaries);

        var dbTransactions = blockDatas.flatMap(blockData => blockData.transactionDatas.map(transactionData => transactionData.dbTransaction));
        dbTransactions.forEach(dbTransaction => dbTransaction.vin.forEach(vin => vin.value = mongodbDecimal.fromString(vin.value.toString())));
        await indexApi.saveTransactions(dbTransactions);

        var dbBlocks = blockDatas.map(blockData => blockData.dbBlock);
        dbBlocks.forEach(dbBlock =>{
            dbBlock.value = mongodbDecimal.fromString(dbBlock.value.toString());
            dbBlock.tx.forEach(tx => tx.value = mongodbDecimal.fromString(tx.value.toString()));
        });
        await indexApi.saveBlocks(dbBlocks);


        //Publish ZMQ events for blocks
        dbBlocks.forEach(dbBlock => {
            indexZmqSock.send(["newBlock",dbBlock.hash]);

            //Publish ZMQ events for blocks transactions
            dbBlock.tx.forEach(function(tx){
                indexZmqSock.send(["newTransaction",tx.txid]);
            });
        });


        //Publish ZMQ events for addresses
        Object.keys(addressIds).forEach(function(addressId){
            indexZmqSock.send(["newAddressTransaction",addressId]);
        });


    };
    indexer.chaincoinZmq = chaincoinZmq; //Setup the service to listen for push notifications
    indexer.start();

    


    //Setup the masternode Service
    
    var MasternodeSerivce = require("./MasternodeService.js");
    var masternodeService = new MasternodeSerivce(chaincoinApi.getMasternodeList);
    masternodeService.masternodeEventCallback_new = function(nmn){
        indexApi.saveMasternodeEvent({
            output: nmn.name,
            time: new Date(),
            event: "newMasternode"
        });

        indexZmqSock.send(["newMasternode",JSON.stringify(nmn)]);

    };
    masternodeService.masternodeEventCallback_removed = function(mn){

        indexApi.saveMasternodeEvent({
            output: mn.name,
            time: new Date(),
            event: "removedMasternode"
        });
        indexZmqSock.send(["removedMasternode",JSON.stringify(mn)]);
        
    };
    masternodeService.masternodeEventCallback_statusChange= function(nmn, mn){
        indexApi.saveMasternodeEvent({
            output: nmn.name,
            time: new Date(),
            event: "changedMasternode",
            oldStatus: mn.value.status,
            newStatus: nmn.value.status
        });

        nmn.value.previousStatus = mn.value.status;
        indexZmqSock.send(["changedMasternode",JSON.stringify(nmn)]);
        
    };
    masternodeService.masternodeEventCallback_ipAddressChange = function(nmn, mn){
        indexApi.saveMasternodeEvent({
            output: nmn.name,
            time: new Date(),
            event: "changedMasternode",
            oldAddress: mn.value.address,
            newAddress: nmn.value.address
        });

        nmn.value.previousAddress = mn.value.address;
        indexZmqSock.send(["Masternode-IpChange",JSON.stringify(nmn)]);
    };
    masternodeService.masternodeEventCallback_expiring = function(nmn){
        
        indexApi.saveMasternodeEvent({
            output: nmn.name,
            time: new Date(),
            event: "expiringMasternode"
        });

        indexZmqSock.send(["expiringMasternode",JSON.stringify(nmn)]);
    };


    masternodeService.start();






    app.get('/', function (req, res) {
        console.log("Got a GET request for the homepage");
        res.send('Hello GET');
    });



    
     
     var server = app.listen(80);
}


indexApi.connect.then(() => start()); //TODO: need to change indexApi to connect in a better way







if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function() {
      return Array.prototype.map.apply(this, arguments).flat(1);
    };
  }

  if (!Array.prototype.flat) {
    Array.prototype.flat = function() {
      var depth = arguments[0];
      depth = depth === undefined ? 1 : Math.floor(depth);
      if (depth < 1) return Array.prototype.slice.call(this);
      return (function flat(arr, depth) {
        var len = arr.length >>> 0;
        var flattened = [];
        var i = 0;
        while (i < len) {
          if (i in arr) {
            var el = arr[i];
            if (Array.isArray(el) && depth > 0)
              flattened = flattened.concat(flat(el, depth - 1));
            else flattened.push(el);
          }
          i++;
        }
        return flattened;
      })(this, depth);
    };
  }


