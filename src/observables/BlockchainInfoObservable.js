const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var blockchainInfo = null;

    var getBlockchainInfo = async () => {
      var newblockchainInfo = await chaincoinService.chaincoinApi.getBlockchainInfo();

      if (blockchainInfo != null && JSON.stringify(blockchainInfo) == JSON.stringify(newblockchainInfo)) return;
      blockchainInfo = newblockchainInfo;
      observer.next(newblockchainInfo);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getBlockchainInfo());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
