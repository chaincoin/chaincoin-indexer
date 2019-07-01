const { Observable, Subject } = require('./node_modules/rxjs');
const { shareReplay } = require('./node_modules/rxjs/operators');


module.exports = function (chaincoinService) {

};


module.exports = function (chaincoinService) {

  var estimateSmartFeeObservableCache = []; //TODO: memory leak

  return (blockCount) => {

    var estimateSmartFeeObservable = estimateSmartFeeObservableCache[blockCount];
    if (estimateSmartFeeObservable == null)
    {
      estimateSmartFeeObservable = Observable.create(function (observer) {

        var estimateSmartFee = null;
    
        var getTxOutSetInfo = async () => {
          var newEstimateSmartFee = await chaincoinService.chaincoinApi.estimateSmartFee(blockCount);
    
          if (estimateSmartFee != null && JSON.stringify(newEstimateSmartFee) ==  JSON.stringify(estimateSmartFee)) return;
          estimateSmartFee = newEstimateSmartFee;
          observer.next(newEstimateSmartFee);
        };
    
        var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getTxOutSetInfo());
    
        return () => {
          bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));
      
      estimateSmartFeeObservable[blockCount] = estimateSmartFeeObservable;
    }

    return estimateSmartFeeObservable;
  };
};
