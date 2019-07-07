const  { Observable, Subject, combineLatest, of } = require('rxjs');
const  { shareReplay, switchMap  } = require('rxjs/operators');

  
module.exports = function(indexerService){

    return (address) =>{
        var filterFunc = (tx) =>{
            return tx.vin.find(vin => vin.address == address) != null || tx.vout.find(vout => vout.scriptPubKey != null && vout.scriptPubKey.addresses != null && vout.scriptPubKey.addresses[0] == address) != null;
        }
        indexerService.MemPoolExtended.pipe(map(memPoolExtended => memPoolExtended.filter(filterFunc)))
    }
};


