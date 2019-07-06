const { Observable, Subject } = require('rxjs');
const { shareReplay, map, switchMap } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var blockHashCache = chaincoinService.BestBlockHash.pipe( //TODO: this could be better 
    map(bestBlockHash => {
      return {};
    }),
    shareReplay({
      bufferSize: 1,
      refCount: false
    })
  );

  return (blockId) => {

    return blockHashCache.pipe(
      switchMap(blockHashCache =>{
        if (blockHashCache[blockId] == null){
          var promise = chaincoinService.chaincoinApi.getBlockHash(blockId);
          blockHashCache[blockId] = promise;

          promise.catch(() => blockHashCache[blockId] = null);
        }
        return blockHashCache[blockId];
      })
    )
  };
};
