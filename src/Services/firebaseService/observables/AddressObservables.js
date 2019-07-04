const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (addressId) => {

    var observable = observableCache[addressId];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getAddress = async () =>{
          var address = await indexerService.indexApi.getAddress(addressId);
          observer.next(address ||  {
            address:  addressId,
            received: 0,
            sent: 0,
            balance: 0,
            txCount: 0,
            lastActivity: 0
          });
        }
    
        var subscription = indexerService.AddressUpdated.subscribe(dbAddress => {
          if (addressId == dbAddress.address) observer.next(dbAddress);
        });

        getAddress();


        return () => {
          subscription.unsubscribe();
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      observableCache[addressId] = observable;
    }

    return observable;
  };
};
