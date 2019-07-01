const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var masternodeWinners = null;

    var getMasternodeWinners = async () => {
      var newMasternodeWinners = await chaincoinService.chaincoinApi.getMasternodeWinners();



      if (masternodeWinners != null && JSON.stringify(newMasternodeWinners) == JSON.stringify(masternodeWinners)) return;
      masternodeWinners = newMasternodeWinners;
      observer.next(newMasternodeWinners);
    };

    var intervalId = setInterval(() => getMasternodeWinners(), 30000);
    getMasternodeWinners();
    
    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
