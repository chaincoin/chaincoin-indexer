
var mongodbDecimal = require('mongodb').Decimal128;
var Big = require('big.js');

var  { Subject } = require('rxjs');
var { first, filter  } = require('rxjs/operators');

class FirebaseService{

    

    constructor(chaincoinService, indexerService) {

        this.chaincoinService = chaincoinService;
        this.indexerService = indexerService;


        this.onError = new Subject();

        this.bestBlockHashSubscription = null;

    }
    


    start()
    {
        if (this.bestBlockHashSubscription != null) throw "Service already started";
        this.bestBlockHashSubscription = this.chaincoinService.BestBlockHash.subscribe((bestBlockHash => this.processBestBlockHash(bestBlockHash)));
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

    async processBestBlockHash(bestBlockHash){

        try
        {
            var subscriptions = await androidServices._getBlockSubscriptions();

            subscriptions.forEach(subscription => {
                androidServices._sendFirebaseMessage(subscription.firebaseId,{
                    eventType: topic,
                    blockHash: blockHash
                });
            });
        }
        catch(ex)
        {
            this.onError.next(ex);
        }
    }


    sendFirebaseMessage(firebaseId, message){
        return new Promise(function(resolve,reject){
            var options = {
              host: "fcm.googleapis.com",
              port: 443,
              path: '/fcm/send',
              method: 'POST',
              headers: {
                  'Authorization': 'key=AIzaSyAyjp-QtYRAxW_XJBxg0LvpO_V6FDicGLQ',
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