const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (masternodeService) {

  var masternodeObservableCache = {}; //TODO: memory leak

  return (output) => {

    var masternodeObservable = masternodeObservableCache[output];
    if (masternodeObservable == null)
    {
      masternodeObservable = Observable.create(function (observer) {

        var masternode = null;

        var getMasternode = async () =>{
          
          var newMasternode = await masternodeService.indexApi.getMasternode(output);

          if (JSON.stringify(masternode) == JSON.stringify(newMasternode)) return;
          masternode = newMasternode;
          observer.next(newMasternode);
        }
    
        var subscription = masternodeService.newMasternodeEvent.subscribe(mnEvent => {
          if (output == mnEvent.output) getMasternode();
        });

        getMasternode();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      masternodeObservableCache[output] = masternodeObservable;
    }

    return masternodeObservable;
  };
};
