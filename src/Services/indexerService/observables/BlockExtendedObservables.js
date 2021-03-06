const { Observable, Subject, combineLatest } = require('rxjs');
const { shareReplay, map } = require('rxjs/operators');


module.exports = function (indexerService) {

  return (hash) => {
    return combineLatest(indexerService.chaincoinService.Block(hash),indexerService.Block(hash))
    .pipe(map(([block, dbBlock]) =>{ 
        if (dbBlock == null) return block;

        var transaction = dbBlock.tx.map(tx => Object.assign({}, tx,{value: parseFloat(tx.value.toString())}));

        return Object.assign({}, block, dbBlock, {
            extended:true,
            value: parseFloat(dbBlock.value.toString()),
            tx:transaction
        });
    }));
  };
};
