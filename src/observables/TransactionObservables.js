const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  var transactionObservableCache = []; //TODO: memory leak

  return (transactionId) => {

    var transactionObservable = transactionObservableCache[transactionId];
    if (transactionObservable == null)
    {
      transactionObservable = Observable.create(function (observer) {

        var transaction = null;
    
        var getTransaction = async () => {
          var newTransaction = await chaincoinService.chaincoinApi.getTransaction(transactionId);
    
          if (transaction != null && JSON.stringify(newTransaction) == JSON.stringify(transaction)) return;
          transaction = newTransaction;
          observer.next(newTransaction);
        };
    
        var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getTransaction());
    
        return () => {
          bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      transactionObservableCache[transactionId] = transactionObservable;
    }

    return blockObservable;
  };
};
