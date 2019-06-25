const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var networkHashps = null;

    var getNetworkHashps = async () => {
      var newNetworkHashps = await chaincoinService.chaincoinApi.getNetworkHashps();

      if (newNetworkHashps == networkHashps) return;
      networkHashps = newNetworkHashps;
      observer.next(newNetworkHashps);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getNetworkHashps());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
