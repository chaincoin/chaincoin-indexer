const { Observable, Subject, from, of } = require('rxjs');
const { shareReplay, switchMap, map, filter, finalize, publishReplay } = require('rxjs/operators');
const { refCountDelay } = require('rxjs-etc/operators');


module.exports = function (chaincoinService) {

  var cache = {};

  return (blockId) => {

    var observable = cache[blockId];
    if (observable == null)
    {
      var _blockHash = null;
      var updating = false;

      observable = chaincoinService.BestBlockHash.pipe(
        filter(bestBlockHash => {
          return _blockHash == null
        }),
        switchMap(bestBlockHash => {
          var subject = new Subject();
          updating = true;
          chaincoinService.chaincoinApi.getBlockHash(blockId)
          .finally(()=>updating = false)
          .then((blockHash) => {
            subject.next(blockHash)
          }).catch(err => {
            subject.error(err)
          });
          return subject;
        }),
        finalize(() => { 
          delete cache[blockId] 
        }),
        publishReplay(1),
        refCountDelay(300000), //cache data for 5 mins
        filter(blockHash => {
          return !updating;
        })
      );
      

      cache[blockId] = observable;
    }
    
    return observable;
  };
};
