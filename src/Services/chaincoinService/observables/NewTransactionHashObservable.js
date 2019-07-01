const  { Observable, Subject  } = require('rxjs');
const  { shareReplay } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var connectSubscription = chaincoinService.chaincoinZmqSockConnect.subscribe((connected) =>{
            if (connected == true) chaincoinService.chaincoinZmqSock.subscribe('hashtx');
        });

        var messageSubscription = chaincoinService.chaincoinZmqSockMessage.subscribe(async ({topic,message,sequence}) =>{

            if (topic == "hashtx")
            {
                var transactionId = message.toString('hex');
                observer.next(transactionId);
            }
        });

        return () => {
            connectSubscription.unsubscribe();
            messageSubscription.unsubscribe();
            chaincoinService.chaincoinZmqSock.unsubscribe('hashtx');
        }
    }).pipe(shareReplay({
        bufferSize: 0,
        refCount: true
    }));
};