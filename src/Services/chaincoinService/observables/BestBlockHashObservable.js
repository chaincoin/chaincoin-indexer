const  { Observable, Subject  } = require('rxjs');
const  { shareReplay } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) { //TODO: add caching

        var bestBlockHash = null;


        var checkBestBlockHash = async () =>{
            var newBestBlockHash = await chaincoinService.chaincoinApi.getBestBlockHash();

            if (bestBlockHash == newBestBlockHash) return;

            bestBlockHash = newBestBlockHash;
            observer.next(newBestBlockHash);
        }


        var newBlockHashSubscription = chaincoinService.NewBlockHash.subscribe(async (newBlockHash) =>{
            checkBestBlockHash();
        });

        checkBestBlockHash();
        

        return () => {
            newBlockHashSubscription.unsubscribe();
        }
    }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};