const { Observable, Subject, from } = require('rxjs');
const { shareReplay, switchMap, map } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var cache = chaincoinService.BestBlockHash.pipe(
    map(bestBlockHash => {
      return {};
    }),
    shareReplay({
      bufferSize: 1,
      refCount: false
    })
  );

  return (transactionId) => {

    return cache.pipe(
      switchMap(cache =>{
        if (cache[transactionId] == null){
          var promise = chaincoinService.chaincoinApi.getTransaction(transactionId);
          cache[transactionId] = promise;

          promise.catch(() => cache[transactionId] = null);
        }
        return cache[transactionId];
      })
    )
  };
};