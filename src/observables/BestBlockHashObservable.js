const  { Observable, Subject  } = require('rxjs');
const  { shareReplay } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var bestBlockHash = null;


        var checkBestBlockHash = async () =>{
            var newBestBlockHash = await chaincoinService.chaincoinApi.getBestBlockHash();

            if (bestBlockHash == newBestBlockHash) return;

            bestBlockHash = newBestBlockHash;
            observer.next(newBestBlockHash);
        }


        var connectSubscription = chaincoinService.chaincoinZmqSockConnect.subscribe((connected) =>{
            if (connected == true) chaincoinService.chaincoinZmqSock.subscribe('hashblock');
        });

        var messageSubscription = chaincoinService.chaincoinZmqSockMessage.subscribe(async ({topic,message,sequence}) =>{

            if (topic == "hashblock")
            {
                var messageBlockHash = message.toString('hex');
                checkBestBlockHash();
            }
        });

        checkBestBlockHash();
        

        return () => {
            connectSubscription.unsubscribe();
            messageSubscription.unsubscribe();
            chaincoinService.chaincoinZmqSock.unsubscribe('hashblock');
        }
    }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};