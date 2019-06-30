const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');




module.exports = function (chaincoinService) {

  var txOutSetInfoObservableCache = []; //TODO: memory leak

  return (blockHash) => {

    var txOutSetInfoObservable = txOutSetInfoObservableCache[blockHash];
    if (txOutSetInfoObservable == null)
    {
      txOutSetInfoObservable = Observable.create(function (observer) {

        var txOutSetInfo = null;
    
        var getTxOutSetInfo = async () => {
          var newTxOutSetInfo = await chaincoinService.chaincoinApi.getTxOutSetInfo(blockHash);
    
          if (txOutSetInfo != null && newTxOutSetInfo.height == txOutSetInfo.bestblock && newTxOutSetInfo.height == txOutSetInfo.bestblock) return;
          txOutSetInfo = newTxOutSetInfo;
          observer.next(newTxOutSetInfo);
        };
    
        var bestBlockHashSubscription = null;
        if (blockHash == null || blockHash == "")chaincoinService.BestBlockHash.subscribe(bestBlockHash => getTxOutSetInfo());
        else getTxOutSetInfo();

        return () => {
          if(bestBlockHashSubscription != null) bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));
      
      txOutSetInfoObservableCache[blockHash] = txOutSetInfoObservable;
    }

    return txOutSetInfoObservable;
  };
};
