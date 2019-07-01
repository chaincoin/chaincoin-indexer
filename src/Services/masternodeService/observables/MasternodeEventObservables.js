const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (masternodeService) {

  var masternodeEventObservableCache = {}; //TODO: memory leak

  return (output, pos) => {

    var masternodeEventObservable = masternodeEventObservableCache[output + "-" + pos];
    if (masternodeEventObservable == null)
    {
      masternodeEventObservable = Observable.create(function (observer) {

   


        var masternodeEvent = null;
        var getMasternodeEvent = async () =>{
          var masternodeEvent = await masternodeService.indexApi.getMasternodeEvent(output, pos);
          observer.next(masternodeEvent);
        }
    
        var subscription = masternodeService.indexApi.Masternode(output).subscribe(dbMasternode => {
          if (masternodeEvent == null && dbMasternode.eventCount > pos) getMasternodeEvent();
        });


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      masternodeEventObservableCache[output] = masternodeEventObservable;
    }

    return masternodeEventObservable;
  };
};
