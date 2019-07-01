const { Observable, Subject } = require('./node_modules/rxjs');
const { shareReplay } = require('./node_modules/rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var masternodeList = null;

    var subscription = chaincoinService.MasternodeList.subscribe(newMasternodeList => {

      if (masternodeList == null) {
        masternodeList = newMasternodeList;
        return;
      }

      Object.keys(newMasternodeList).forEach(output => {
        if (masternodeList[output] == null) observer.next({output:output, mn:newMasternodeList[output]});
      })

      masternodeList = newMasternodeList;
    });

    return () => {
      subscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 0,
    refCount: true
  }));

};
