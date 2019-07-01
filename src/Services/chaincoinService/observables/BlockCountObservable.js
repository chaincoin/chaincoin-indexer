const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var blockCount = null;

    var getBlockCount = async () => {
      var newBlockCount = await chaincoinService.chaincoinApi.getBlockCount();

      if (newBlockCount == blockCount) return;
      blockCount = newBlockCount;
      observer.next(newBlockCount);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getBlockCount());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
