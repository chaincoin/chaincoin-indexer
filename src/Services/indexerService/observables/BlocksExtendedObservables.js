const { Observable, Subject, combineLatest, zip } = require('rxjs');
const { shareReplay, map, switchMap, first } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: could share this data

  return (blockId, pageSize) => {
    var observables = [];
    for(var i = 0; i < pageSize; i++)
    {
        observables.push(indexerService.chaincoinService.BlockHash(blockId - i).pipe(
            switchMap(blockHash => {
                return zip(indexerService.chaincoinService.Block(blockHash),indexerService.Block(blockHash)).pipe(
                    map(([block, dbBlock]) =>{ 
                        if (dbBlock == null) return block;
                        var transaction = dbBlock.tx.map(tx => Object.assign({}, tx,{value: parseFloat(tx.value.toString())}));
                        return Object.assign({}, block, dbBlock, {
                            extended:true,
                            value: parseFloat(dbBlock.value.toString()),
                            tx:transaction
                        });
                    })
                )
            })
        ));
    }
    
    return zip(...observables);
  }
};
