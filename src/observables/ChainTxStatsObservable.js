const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var chainTxStats = null;

    var getChainTxStats = async () => {
      var newChainTxStats = await chaincoinService.chaincoinApi.getChainTxStats();

      if (chainTxStats != null && newChainTxStats.time == chainTxStats.time) return;
      chainTxStats = newChainTxStats;
      observer.next(newChainTxStats);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getChainTxStats());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
