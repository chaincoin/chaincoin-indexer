const { Observable, Subject } = require('rxjs');
const { shareReplay, switchMap } = require('rxjs/operators');


module.exports = function (indexerService) {

  var observableCache = {}; //TODO: memory leak 
                            //TODO: not event drive, e.g. from the indexer events, new tx and spent
  return (address) => {

    var observable = observableCache[address];
    if (observable == null)
    {

      observable = indexerService.Address(address).pipe( 
        switchMap(addressModel => {
          return indexerService.indexApi.getAddressUnspent(address)
        }),
        shareReplay({
          bufferSize: 1,
          refCount: true
        })
      )

      observableCache[address] = observable;
    }

    return observable;
  };
};
