const { Observable, Subject, from, of } = require('rxjs');
const { shareReplay, switchMap, map, filter, finalize, publishReplay } = require('rxjs/operators');
const { refCountDelay } = require('rxjs-etc/operators');


module.exports = function (chaincoinService) {


  
  var cache = {};

  return (transactionId) => {

    var observable = cache[transactionId];
    if (observable == null)
    {
      var _transaction = null;
      var updating = false;

      observable = chaincoinService.BestBlockHash.pipe(
        filter(bestBlockHash => {
          return _transaction == null || _transaction.blockhash == null
        }),
        switchMap(bestBlockHash => {
          var subject = new Subject();
          updating = true;
          chaincoinService.chaincoinApi.getTransaction(transactionId)
          .finally(()=>updating = false)
          .then((transaction) => {
            subject.next(transaction)
          }).catch(err => {
            subject.error(err)
          });
          return subject;
        }),
        switchMap(transaction =>{
          _transaction = transaction;
          if (transaction.blockhash != null){
            return chaincoinService.Block(transaction.blockhash).pipe(
              map(block =>{
                return Object.assign({},transaction,{confirmations:block.confirmations});
              })
            );
          } 
          
          return of(transaction);
        }),
        finalize(() => { 
          delete cache[transactionId] 
        }),
        publishReplay(1),
        refCountDelay(300000), //cache data for 5 mins
        filter(block => {
          return !updating;
        })
      );
      

      cache[transactionId] = observable;
    }
    
    return observable;
  };
};
