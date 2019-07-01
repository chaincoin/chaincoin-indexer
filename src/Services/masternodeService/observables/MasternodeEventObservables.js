const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (masternodeService) {

  var masternodeEventObservableCache = {}; //TODO: memory leak

  return (output, pos) => {

    var masternodeEventObservable = masternodeEventObservableCache[output + "-" + pos];
    if (masternodeEventObservable == null)
    {
      masternodeEventObservable = Observable.create(function (observer) {

   
        var getMasternodeEvent = async () =>{
          var masternodeEvent = await masternodeService.indexApi.getMasternodeEvent(output, pos);

          observer.next(masternodeEvent);
        }

        getMasternodeEvent();


        return () => {
          
        }
      }).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
      }));

      masternodeEventObservableCache[output] = masternodeEventObservable;
    }

    return masternodeEventObservable;
  };
};
