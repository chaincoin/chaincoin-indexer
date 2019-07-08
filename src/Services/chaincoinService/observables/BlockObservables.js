const { Observable, Subject, from, ReplaySubject } = require('rxjs');
const { shareReplay, switchMap, map } = require('rxjs/operators');



var BlockCache = (chaincoinService) =>{


  var cache = {};


  return {
    getBlock:(hash) =>{
     

      if (cache[hash] == null)
      {
        cache = Observable.create(function (observer){


          return () =>{
            cache[hash] = null;
          }
        }).pipe(shareReplay({
          bufferSize: 1,
          refCount: true
        }));
        
        
      }

      return cache[hash];
    }
  }
}

module.exports = function (chaincoinService) {

  
  

  return (hash) => {

    return blockCache.pipe(
      switchMap(blockCache =>{
        if (blockCache[hash] == null){
          var promise = chaincoinService.chaincoinApi.getBlock(hash);
          blockCache[hash] = promise;

          promise.catch(() => blockCache[hash] = null);
        }
        return blockCache[hash];
      })
    )
  };
};
