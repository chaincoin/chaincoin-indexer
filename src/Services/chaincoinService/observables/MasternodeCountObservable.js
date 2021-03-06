const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var masternodeCount = null;

    var getMasternodeCount = async () => {
      var newMasternodeCount = await chaincoinService.chaincoinApi.getMasternodeCount();



      if (masternodeCount != null && JSON.stringify(newMasternodeCount) == JSON.stringify(masternodeCount)) return;
      masternodeCount = newMasternodeCount;
      observer.next(newMasternodeCount);
    };

    var intervalId = setInterval(() => getMasternodeCount(), 30000);

    getMasternodeCount();

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
