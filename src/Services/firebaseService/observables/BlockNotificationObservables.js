const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (firebaseService) {

  var observableCache = {}; //TODO: memory leak

  return (firebaseId) => {

    var observable = observableCache[firebaseId];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var isBlockSubscription = async () =>{
          var blockSubscription = await firebaseService.indexApi.isBlockSubscription(firebaseId);
          observer.next(blockSubscription);
        }
    
        var subscription = indexerService.SetBlockNotificationEvent.subscribe(SetBlockNotificationEvent => { //TODO: make event driven
          if (firebaseId == SetBlockNotificationEvent.firebaseId) observer.next(SetBlockNotificationEvent.enabled);
        });

        isBlockSubscription();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[firebaseId] = observable;
    }

    return observable;
  };
};
