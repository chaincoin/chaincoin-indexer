const  { Observable, Subject  } = require('rxjs');
const  { shareReplay } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var connectSubscription = chaincoinService.chaincoinZmqSockConnect.subscribe((connected) =>{
            if (connected == true) chaincoinService.chaincoinZmqSock.subscribe('hashblock');
        });

        var messageSubscription = chaincoinService.chaincoinZmqSockMessage.subscribe(async ({topic,message,sequence}) =>{

            if (topic == "hashblock")
            {
                var blockHash = message.toString('hex');
                observer.next(blockHash);
            }
        });

        return () => {
            connectSubscription.unsubscribe();
            messageSubscription.unsubscribe();
            chaincoinService.chaincoinZmqSock.unsubscribe('hashblock');
        }
    }).pipe(shareReplay({
        bufferSize: 0,
        refCount: true
    }));
};