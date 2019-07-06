const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (firebaseService) {

  var observableCache = {}; //TODO: memory leak

  return (firebaseId, output) => {

    var observable = observableCache[firebaseId + "-" + output];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getMasternodeNotification = async () =>{
          var masternodeNotification = await firebaseService.indexApi.isMasternodeSubscription(firebaseId, output);
          observer.next(masternodeNotification);
        }
    
        var subscription = firebaseService.SetMasternodeNotificationEvent.subscribe(SetMasternodeNotification => { 
          if (SetMasternodeNotification.firebaseId == firebaseId && SetMasternodeNotification.output == output) observer.next(SetMasternodeNotification.enabled);
        });

        getMasternodeNotification();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[firebaseId + "-" + output] = observable;
    }

    return observable;
  };
};
