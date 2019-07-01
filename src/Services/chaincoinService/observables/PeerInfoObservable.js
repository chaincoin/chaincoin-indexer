const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var peerInfo = null;

    var getPeerInfo = async () => {
      var newPeerInfo = await chaincoinService.chaincoinApi.getPeerInfo();



      if (peerInfo != null && JSON.stringify(newPeerInfo) == JSON.stringify(peerInfo)) return;
      peerInfo = newPeerInfo;
      observer.next(newPeerInfo);
    };

    var intervalId = setInterval(() => getPeerInfo(), 30000);

    getPeerInfo();

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
