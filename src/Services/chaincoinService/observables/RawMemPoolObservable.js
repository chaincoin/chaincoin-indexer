const  { Observable, Subject, combineLatest  } = require('rxjs');
const  { shareReplay  } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var rawMemPool = null;


        var getRawMemPool = async () =>{
            var newRawMemPool = await chaincoinService.chaincoinApi.getRawMemPool();

            if (rawMemPool != null && JSON.stringify(newRawMemPool) == JSON.stringify(rawMemPool)) return;

            rawMemPool = newRawMemPool;
            observer.next(newRawMemPool);
        }


        var newBlockHashSubscription = chaincoinService.NewBlockHash.subscribe(() =>{
            getRawMemPool();
        });

        var newTransactionHashSubscription = chaincoinService.NewTransactionHash.subscribe(() =>{
            getRawMemPool();
        });


        getRawMemPool();
        

        return () => {
            newBlockHashSubscription.unsubscribe();
            newTransactionHashSubscription.unsubscribe();
        }
    }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};