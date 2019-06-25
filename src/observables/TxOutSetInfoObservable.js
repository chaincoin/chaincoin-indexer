const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var txOutSetInfo = null;

    var getTxOutSetInfo = async () => {
      var newTxOutSetInfo = await chaincoinService.chaincoinApi.getTxOutSetInfo();

      if (txOutSetInfo != null && newTxOutSetInfo.height == txOutSetInfo.bestblock && newTxOutSetInfo.height == txOutSetInfo.bestblock) return;
      txOutSetInfo = newTxOutSetInfo;
      observer.next(newTxOutSetInfo);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getTxOutSetInfo());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
