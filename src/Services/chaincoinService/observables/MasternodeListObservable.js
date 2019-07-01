const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var masternodeList = null;

    var getMasternodeList = async () => {
      var newMasternodeList = await chaincoinService.chaincoinApi.getMasternodeList();

      if (masternodeList != null && JSON.stringify(newMasternodeList) == JSON.stringify(masternodeList)) return;
      masternodeList = newMasternodeList;
      observer.next(newMasternodeList);
    };

    var intervalId = setInterval(() => getMasternodeList(), 30000);

    getMasternodeList();

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
