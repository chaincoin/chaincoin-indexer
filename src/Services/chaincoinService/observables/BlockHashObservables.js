const { Observable, Subject } = require('./node_modules/rxjs');
const { shareReplay } = require('./node_modules/rxjs/operators');


module.exports = function (chaincoinService) {

  var blockHashObservable = []; //TODO: memory leak

  return (blockId) => {

    var blockHashObservable = blockHashObservableCache[blockId];
    if (blockHashObservable == null)
    {
      blockHashObservable = Observable.create(function (observer) {

        var blockHash = null;
    
        var getBlock = async () => {
          var newBlockHash = await chaincoinService.chaincoinApi.getBlockHash(blockId);
    
          if (blockHash != newBlockHash) return;
          blockHash = newBlockHash;
          observer.next(newBlockHash);
        };
    
        getBlock();

        //TODO: detect reorg and then make sure hash for blockId hasnt changed
    
        return () => {
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));
      
      blockHashObservable[blockId] = blockHashObservable;
    }

    return blockObservable;
  };
};
