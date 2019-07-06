const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (firebaseService) {

  var observableCache = {}; //TODO: memory leak

  return (firebaseId, address) => {

    var observable = observableCache[address];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getAddressNotification = async () =>{
          var addressNotification = await firebaseService.indexApi.isAddressSubscription(firebaseId, address);
          observer.next(addressNotification);
        }
    
        var subscription = firebaseService.SetAddressNotificationEvent.subscribe(SetAddressNotification => { 
          if (SetAddressNotification.firebaseId == firebaseId && SetAddressNotification.address == address) observer.next(SetAddressNotification.enabled);
        });

        getAddressNotification();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[address] = observable;
    }

    return observable;
  };
};
