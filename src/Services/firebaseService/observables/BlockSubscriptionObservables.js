const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (firebaseId) => {

    var observable = observableCache[firebaseId];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var isBlockSubscription = async () =>{
          var blockSubscription = await indexerService.indexApi.isBlockSubscription(observable);
          observer.next(blockSubscription);
        }
    
        /*var subscription = indexerService.AddressUpdated.subscribe(dbAddress => { //TODO: make event driven
          if (addressId == dbAddress.address) observer.next(dbAddress);
        });*/

        isBlockSubscription();


        return () => {
          //subscription.unsubscribe();
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
