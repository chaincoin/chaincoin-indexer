const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak
  var cache = {};

  return (hash) => {

    var observable = observableCache[hash];
    if (observable == null)
    {
      var expiryTimer = null;

      observable = Observable.create(function (observer) {

        clearTimeout(expiryTimer);
        expiryTimer = null;

        var getBlock = async () =>{
          var block = await indexerService.indexApi.getBlock(hash);
          cache[hash] = block;
          observer.next(block);
        }
    
        var subscription = indexerService.BlockAdded.subscribe(dbBlock => {
          if (hash == dbBlock.hash) observer.next(dbBlock);
        });

        getBlock();


        return () => {
          subscription.unsubscribe();
          expiryTimer = setTimeout(() => delete cache[hash], 90000); //clear cached data after 90 seconds of not being accessed
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[hash] = observable;
    }

    return observable;
  };
};
