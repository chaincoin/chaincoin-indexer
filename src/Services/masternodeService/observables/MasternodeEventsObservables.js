const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: not event driven or shared
  return (output,pos,pageSize) => Observable.create(function (observer) {


    var getMasternodeEvents = async () =>{
      var events = await indexerService.indexApi.getMasternodeEvents(output,pos,pageSize);
      observer.next(events);
    }

    getMasternodeEvents();


    return () => {
    }
  });
};
