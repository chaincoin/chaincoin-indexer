const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var blockObservableCache = []; //TODO: memory leak

  return (blockHash) => {

    var blockObservable = blockObservableCache[blockHash];
    if (blockObservable == null)
    {
      blockObservable = Observable.create(function (observer) {

        var block = null;
    
        var getBlock = async () => {

          try
          {
            var newBlock = await chaincoinService.chaincoinApi.getBlock(blockHash);
    
            if (block != null && JSON.stringify(newBlock) == JSON.stringify(block)) return;
            block = newBlock;
            observer.next(newBlock);
          }
          catch(ex)
          {
            observer.error(ex);
          }
          
        };
    
        var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getBlock());
    
        return () => {
          bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      blockObservableCache[blockHash] = blockObservable;
    }

    return blockObservable;
  };
};
