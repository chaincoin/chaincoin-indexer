const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var masternodeList = null;

    var subscription = chaincoinService.MasternodeList.subscribe(newMasternodeList => {

      if (masternodeList == null) {
        masternodeList = newMasternodeList;
        return;
      }

      Object.keys(newMasternodeList).forEach(output => {
        if (masternodeList[output] != null && masternodeList[output].status != newMasternodeList[output].status) observer.next({output:output, oldstate:newMasternodeList[output], newState:newMasternodeList[output]});
      })

      masternodeList = newMasternodeList;
    });

    return () => {
      subscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));

};