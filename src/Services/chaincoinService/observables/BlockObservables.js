const { Observable, Subject, from } = require('rxjs');
const { shareReplay, switchMap, map } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var blockCache = chaincoinService.BestBlockHash.pipe(
    map(bestBlockHash => {
      return {};
    }),
    shareReplay({
      bufferSize: 1,
      refCount: false
    })
  );

  return (hash) => {

    return blockCache.pipe(
      switchMap(blockCache =>{
        if (blockCache[hash] == null){
          var promise = chaincoinService.chaincoinApi.getBlock(hash);
          blockCache[hash] = promise;
        }
        return blockCache[hash];
      })
    )
  };
};
