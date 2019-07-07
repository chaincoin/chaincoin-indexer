const { combineLatest } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (indexerService) {

  return (transactionId) => { //TODO: caching 

    return combineLatest(indexerService.chaincoinService.Transaction(transactionId),indexerService.Transaction(transactionId))
    .pipe(map(([transaction, dbTransaction]) =>{ 

        if (dbTransaction == null) return transaction;

        var vin = dbTransaction.vin.map(vin => {
            if (vin.coinbase != null) return vin;
            return Object.assign({}, vin,{value: parseFloat(vin.value.toString())})
        });

        return Object.assign({}, transaction, dbTransaction, {
            extended:true,
            vin:vin
        });
    }));
  };
};
