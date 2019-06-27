const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var blockObservableCache = []; //TODO: memory leak

  return (blockId) => {

    var blockObservable = blockObservableCache[blockId];
    if (blockObservable == null)
    {
      blockObservable = Observable.create(function (observer) {

        var block = null;
    
        var getBlock = async () => {
          var newBlock = await chaincoinService.chaincoinApi.getBlock(blockId);
    
          if (block != null && JSON.stringify(newBlock) == JSON.stringify(block)) return;
          block = newBlock;
          observer.next(newBlock);
        };
    
        var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getBlock());
    
        return () => {
          bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));
      
      blockObservableCache[blockId] = blockObservable;
    }

    return blockObservable;
  };
};
