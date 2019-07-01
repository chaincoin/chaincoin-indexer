const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');



module.exports = function (chaincoinService) {

  var networkHashpsObservableCache = []; //TODO: memory leak

  return (blockHash) => {

    var networkHashpsObservable = networkHashpsObservableCache[blockHash];
    if (networkHashpsObservable == null)
    {
      networkHashpsObservable = Observable.create(function (observer) {

        var networkHashps = null;

        var getNetworkHashps = async () => {
          var newNetworkHashps = await chaincoinService.chaincoinApi.getNetworkHashps(blockHash);

          if (newNetworkHashps == networkHashps) return;
          networkHashps = newNetworkHashps;
          observer.next(newNetworkHashps);
        };

        var bestBlockHashSubscription = null;
        if (blockHash == null || blockHash == "") chaincoinService.BestBlockHash.subscribe(bestBlockHash => getNetworkHashps());
        else getNetworkHashps()

        return () => {
          if (bestBlockHashSubscription != null) bestBlockHashSubscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));
      
      networkHashpsObservableCache[blockHash] = networkHashpsObservable;
    }

    return networkHashpsObservable;
  };
};

