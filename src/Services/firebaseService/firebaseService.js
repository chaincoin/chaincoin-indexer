
var https = require("https");
var mongodbDecimal = require('mongodb').Decimal128;
var Big = require('big.js');

var  { Subject } = require('rxjs');
var { first, filter  } = require('rxjs/operators');

class FirebaseService{

    

    constructor(chaincoinService, indexerService, indexApi, firebaseKey) {

        this.chaincoinService = chaincoinService;
        this.indexerService = indexerService;
        this.indexApi = indexApi;
        this.firebaseKey = firebaseKey;

        
        this.onError = new Subject();

        this.bestBlockHashSubscription = null;


        this.SetBlockNotificationEvent = new Subject();
        this.SetMasternodeNotificationEvent = new Subject();
        this.SetAddressNotificationEvent = new Subject();

        this.BlockNotification = require('./observables/BlockNotificationObservables')(this);
        this.SetBlockNotification = require('./observables/SetBlockNotificationObservables')(this);

        this.AddressNotification = require('./observables/AddressNotificationObservables')(this);
        this.SetAddressNotification = require('./observables/SetAddressNotificationObservables')(this);

        this.MasternodeNotification = require('./observables/MasternodeNotificationObservables')(this);
        this.SetMasternodeNotification = require('./observables/SetMasternodeNotificationObservables')(this);

    }
    


    start()
    {
        if (this.bestBlockHashSubscription != null) throw "Service already started";
        this.bestBlockHashSubscription = this.chaincoinService.BestBlockHash.subscribe((bestBlockHash => this.processBestBlockHash(bestBlockHash)));
        this.addressUpdatedSubscription = this.indexerService.AddressUpdated.subscribe((dbAddress => this.processAddress(dbAddress)));
        this.masternodeListEntryAddedSubscription = this.chaincoinService.MasternodeListEntryAdded.subscribe((mnEntry => this.processMasternodeAdded(mnEntry)));
        this.masternodeListEntryStatusChangedSubscription = this.chaincoinService.MasternodeListEntryStatusChanged.subscribe((mnEntry => this.processMasternodeChanged(mnEntry)));
        this.masternodeListEntryRemovedSubscription = this.chaincoinService.MasternodeListEntryRemoved.subscribe((mnEntry => this.processMasternodeRemoved(mnEntry)));
        this.masternodeListEntryExpiringSubscription = this.chaincoinService.MasternodeListEntryExpiring.subscribe((mnEntry => this.processMasternodeExpiring(mnEntry)));
        
    }

    stop()
    {
        if (this.bestBlockHashSubscription == null) throw "Service not started";
        this.bestBlockHashSubscription.unsubscribe();
        this.addressUpdatedSubscription.unsubscribe();
        this.masternodeListEntryAddedSubscription.unsubscribe();
        this.masternodeListEntryStatusChangedSubscription.unsubscribe();
        this.masternodeListEntryRemovedSubscription.unsubscribe();
        this.masternodeListEntryExpiringSubscription.unsubscribe();


        this.bestBlockHashSubscription = null;
        this.addressUpdatedSubscription = null;
        this.masternodeListEntryAddedSubscription = null;
        this.masternodeListEntryStatusChangedSubscription = null;
        this.masternodeListEntryRemovedSubscription = null;
        this.masternodeListEntryExpiringSubscription = null;
    }

    isRunning(){
        return this.bestBlockHashSubscription != null;
    }

    async processBestBlockHash(bestBlockHash){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getBlockSubscriptions(); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "newBlock",
                    blockHash: bestBlockHash
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }

    async processAddress(dbAddress){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getAddressSubscriptions(dbAddress.address); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "newAddressTransaction",
                    address: dbAddress.address
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }


    async processMasternodeAdded(mnEntry){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getMasternodeSubscriptions(mnEntry.output); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "newMasternode",
                    masternodeOutPoint: mnEntry.output
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }

    async processMasternodeChanged(mnEntry){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getMasternodeSubscriptions(mnEntry.output); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "changedMasternode",
                    masternodeOutPoint: mnEntry.output,
                    status: mnEntry.newState.status,
                    previousStatus:mnEntry.oldState.status,
                    
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }

    async processMasternodeRemoved(mnEntry){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getMasternodeSubscriptions(mnEntry.output); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "removedMasternode",
                    masternodeOutPoint: mnEntry.output                    
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }

    async processMasternodeExpiring(mnEntry){

        try
        {
            var subscriptions = await this.indexerService.indexApi.getMasternodeSubscriptions(mnEntry.output); //TODO: shouldnt be accessing index api directly

            subscriptions.forEach(subscription => {
                this.sendFirebaseMessage(subscription.firebaseId,{
                    eventType: "expiringMasternode",
                    masternodeOutPoint: mnEntry.output                    
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }


    sendFirebaseMessage(firebaseId, message){
        return new Promise((resolve,reject) =>{
            var options = {
              host: "fcm.googleapis.com",
              port: 443,
              path: '/fcm/send',
              method: 'POST',
              headers: {
                  'Authorization': 'key=' + this.firebaseKey,
                  'Content-Type': 'application/json',
              }
            };
            var req = https.request(options, function(res) {
              //console.log('Status: ' + res.statusCode);
              //console.log('Headers: ' + JSON.stringify(res.headers));
              res.setEncoding('utf8');
              res.on('data', function (body) {
        
              });
              res.on('end', function (body) {
                resolve();
              });
            });
            req.on('error', function(e) {
                console.log("firebaseMessage failed: ",JSON.stringify(e, null, 2));
                reject(e);
            });
            
            var data = { 
                "data": message,
                "to" : firebaseId,
                "android":{
                    "priority":"high"
                }
            };
            
            // write data to request body
            req.write(JSON.stringify(data));
            req.end();
           
        })

    }


}


module.exports = FirebaseService;