const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak

  return (address, pos) => {

    var observable = observableCache[address + "-" + pos];
    if (observable == null)
    {
      
      observable = Observable.create(function (observer) {

        var addressTx = null;
        var getAddressTx = async () =>{
          var addressTx = await indexerService.indexApi.getAddressTx(address, pos);
          observer.next(addressTx);
        }
    
        var subscription = indexerService.Address(address).subscribe(dbAddress => {
          if (addressTx == null && dbAddress.txCount > pos) getAddressTx(); //TODO: this refreshes data more often than needed
        });


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
