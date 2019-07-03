const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: not event driven or shared
  return (pos,pageSize) => Observable.create(function (observer) {


    var getRichList = async () =>{
      var richList = await indexerService.indexApi.getRichList(pos,pageSize);
      observer.next(richList);
    }

    getRichList();


    return () => {
    }
  });
};
