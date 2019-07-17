const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var chainTips = null;

    var getChainTips = async () => {
      var newChainTips = await chaincoinService.chaincoinApi.getChainTips();

      if (chainTips != null && JSON.stringify(chainTips) == JSON.stringify(newChainTips)) return;
      chainTips = newChainTips;
      observer.next(newChainTips);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getChainTips());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
