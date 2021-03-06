const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var difficulty = null;

    var getDifficulty = async () => {
      var newDifficulty = await chaincoinService.chaincoinApi.getDifficulty();

      if (newDifficulty == difficulty) return;
      difficulty = newDifficulty;
      observer.next(newDifficulty);
    };

    var bestBlockHashSubscription = chaincoinService.BestBlockHash.subscribe(bestBlockHash => getDifficulty());

    return () => {
      bestBlockHashSubscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};

