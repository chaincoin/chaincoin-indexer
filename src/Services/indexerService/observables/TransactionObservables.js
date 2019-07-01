const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (transactionId) => {

    var observable = observableCache[transactionId];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getTransaction = async () =>{
          var transaction = await indexerService.indexApi.getTransaction(transactionId);
          observer.next(transaction);
        }
    
        var subscription = indexerService.BlockAdded.subscribe(dbTransaction => {
          if (transactionId == dbTransaction.txid) observer.next(dbTransaction);
        });

        getTransaction();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[transactionId] = observable;
    }

    return observable;
  };
};
