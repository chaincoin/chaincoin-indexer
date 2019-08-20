const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var bannedList = null;

    var getBannedList = async () => {
      var newBannedList = await chaincoinService.chaincoinApi.getBannedList();



      if (bannedList != null && JSON.stringify(newBannedList) == JSON.stringify(bannedList)) return;
      bannedList = newBannedList;
      observer.next(newBannedList);
    };

    var intervalId = setInterval(() => getBannedList(), 30000);

    getBannedList();

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
