const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var connectionCount = null;

    var getConnectionCount = async () => {
      var newConnectionCount = await chaincoinService.chaincoinApi.getConnectionCount();



      if (connectionCount != null && newConnectionCount == connectionCount) return;
      connectionCount = newConnectionCount;
      observer.next(newConnectionCount);
    };

    var intervalId = setInterval(() => getConnectionCount(), 30000);

    return () => {
      clearInterval(intervalId);
    }
  }).pipe(shareReplay({
    bufferSize: 1,
    refCount: true
  }));
};
