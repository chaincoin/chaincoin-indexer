const { Observable, Subject, from, of } = require('rxjs');
const { shareReplay, switchMap, map, filter, finalize, publishReplay } = require('rxjs/operators');
const { refCountDelay } = require('rxjs-etc/operators');


module.exports = function (chaincoinService) {


  
  var blockCache = {};

  return (hash) => {

    var observable = blockCache[hash];
    if (observable == null)
    {
      var _block = null;
      var updatingBlock = false;

      observable = chaincoinService.BestBlockHash.pipe(
        filter(bestBlockHash => {
          return _block == null || _block.nextblockhash == null
        }),
        switchMap(bestBlockHash => {
          var subject = new Subject();
          updatingBlock = true;
          chaincoinService.chaincoinApi.getBlock(hash)
          .finally(()=>updatingBlock = false)
          .then((block) => {
            subject.next(block)
          }).catch(err => {
            subject.error(err)
          });
          return subject;
        }),
        switchMap(block =>{
          _block = block;
          if (block.nextblockhash != null){
            return chaincoinService.BlockCount.pipe(
              map(blockCount =>{
                return Object.assign({},block,{confirmations:(blockCount - block.height) + 1});
              })
            );
          } 
          
          return of(block);
        }),
        finalize(() => { 
          delete blockCache[hash] 
        }),
        publishReplay(1),
        refCountDelay(300000), //cache data for 5 mins
        filter(block => {
          return !updatingBlock;
        })
        /*finalize(() => { 
          var subscription = observable.subscribe(); 
          setTimeout(() => {
            subscription.unsubscribe()
          },5000);
        })*/
      );
      

      blockCache[hash] = observable;
    }
    
    return observable;
  };
};
