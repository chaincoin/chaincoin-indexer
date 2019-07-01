const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (blockHash) => {

    var observable = observableCache[blockHash];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getBlock = async () =>{
          var block = await indexerService.indexApi.getBlock(blockHash);
          observer.next(block);
        }
    
        var subscription = indexerService.BlockAdded.subscribe(dbBlock => {
          if (blockHash == dbBlock.hash) observer.next(dbBlock);
        });

        getBlock();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[blockHash] = observable;
    }

    return observable;
  };
};
