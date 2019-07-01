const { Observable, Subject } = require('./node_modules/rxjs');
const { shareReplay } = require('./node_modules/rxjs/operators');


module.exports = function (chaincoinService) {

  var masternodeListEntryObservableCache = []; //TODO: memory leak

  return (output) => {

    var masternodeListEntryObservable = masternodeListEntryObservableCache[output];
    if (masternodeListEntryObservable == null)
    {
      masternodeListEntryObservable = Observable.create(function (observer) {

        var masternode = null;
    
        var subscription = chaincoinService.MasternodeList.subscribe(masternodeList => {
          var newMasternode = masternodeList[output];
          if (JSON.stringify(masternode) == JSON.stringify(newMasternode)) return;
          masternode = newMasternode;
          observer.next(newMasternode);
        });
    
        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      masternodeListEntryObservableCache[output] = masternodeListEntryObservable;
    }

    return masternodeListEntryObservable;
  };
};
