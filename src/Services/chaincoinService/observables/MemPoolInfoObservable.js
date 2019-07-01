const  { Observable, Subject  } = require('rxjs');
const  { shareReplay, combineAll  } = require('rxjs/operators');

  
module.exports = function(chaincoinService){

    return Observable.create(function(observer) {

        var memPoolInfo = null;


        var getMemPoolInfo = async () =>{
            var newMemPoolInfo = await chaincoinService.chaincoinApi.getMemPoolInfo();

            if (memPoolInfo != null && JSON.stringify(newMemPoolInfo) == JSON.stringify(memPoolInfo)) return;

            memPoolInfo = newMemPoolInfo;
            observer.next(newMemPoolInfo);
        }


        var subscription = combineAll(chaincoinService.NewBlockHash,chaincoinService.NewTransactionHash).subscribe(() =>{
            getMemPoolInfo();
        });

        getMemPoolInfo();
        

        return () => {
            subscription.unsubscribe();
        }
    }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};