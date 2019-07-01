const  { Observable, Subject  } = require('rxjs');
const  { shareReplay, combineAll  } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var rawMemPool = null;


        var getRawMemPool = async () =>{
            var newRawMemPool = await chaincoinService.chaincoinApi.getMemPoolInfo();

            if (rawMemPool != null && JSON.stringify(newRawMemPool) == JSON.stringify(rawMemPool)) return;

            rawMemPool = newRawMemPool;
            observer.next(newRawMemPool);
        }


        var subscription = combineAll(chaincoinService.NewBlockHash,chaincoinService.NewTransactionHash).subscribe(() =>{
            getRawMemPool();
        });

        getRawMemPool();
        

        return () => {
            subscription.unsubscribe();
        }
    }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};