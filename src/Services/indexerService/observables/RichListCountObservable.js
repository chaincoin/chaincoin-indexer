const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) {

  

  return Observable.create(function (observer) {


    var getRichListCount = async () =>{
      count = await indexerService.indexApi.getRichListCount();
      observer.next(count);
    }

    var subscription = indexerService.AddressesInserted.subscribe((inserted) => {
      if (count != null) observer.next(count + inserted);
    });

    getRichListCount();


    return () => {
      subscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
