const  { Observable, Subject, combineLatest, of } = require('rxjs');
const  { shareReplay, switchMap  } = require('rxjs/operators');

  
module.exports = function(indexerService){

    return indexerService.chaincoinService.RawMemPool.pipe( //TODO: this could be better, e.g. paging, subscribe to mempool filtered by address etc
        switchMap(rawMemPool => {
            if (rawMemPool.length == 0) return of([]);
            return combineLatest(rawMemPool.map(txId =>indexerService.TransactionExtended(txId)))
        })
    ).pipe(shareReplay({
        bufferSize: 1,
        refCount: true
    }));
};