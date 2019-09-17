const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var gObjectList = null;

    var getGObjectList = async () => {
      var newGObjectList = await chaincoinService.chaincoinApi.getGObjectList();



      if (gObjectList != null && JSON.stringify(newGObjectList) == JSON.stringify(gObjectList)) return;
      gObjectList = newGObjectList;
      observer.next(newGObjectList);
    };

    var intervalId = setInterval(() => getGObjectList(), 30000);

    getGObjectList();

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
