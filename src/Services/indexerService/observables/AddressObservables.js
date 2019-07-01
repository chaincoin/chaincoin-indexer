const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (address) => {

    var observable = observableCache[address];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {


        var getAddress = async () =>{
          var address = await indexerService.indexApi.getAddress(address);
          observer.next(address);
        }
    
        var subscription = indexerService.AddressUpdated.subscribe(dbAddress => {
          if (address == dbAddress.address) observer.next(dbAddress);
        });

        getAddress();


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
