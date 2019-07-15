const { Observable, Subject } = require('rxjs');
const { publishReplay } = require('rxjs/operators');
const { refCountDelay } = require('rxjs-etc/operators');

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
  }).pipe(
    publishReplay(1),
    refCountDelay(300000)
  );
};
