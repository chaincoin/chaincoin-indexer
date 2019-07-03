const { Observable, Subject, from, combineLatest } = require('rxjs');
const { shareReplay, switchMap, map, first} = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return (blockId, pageSize) =>chaincoinService.BestBlockHash.pipe(
    switchMap(bestBlockHash =>{
        var observables = [];
        for(var i = 0; i < pageSize; i++)
        {
          observables.push(chaincoinService.BlockHash(blockId - i).pipe(
              switchMap(hash => {
                  return chaincoinService.Block(hash).pipe()
              })
          ));

        }

        return combineLatest(observables);
    })
  )
};
