const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: not event driven or shared
  return (address,pos,pageSize) => Observable.create(function (observer) {


    var getAddressTxs = async () =>{
      var addressTxs = await indexerService.indexApi.getAddressTxs(address,pos,pageSize);
      observer.next(addressTxs);
    }

    getAddressTxs();


    return () => {
    }
  });
};
