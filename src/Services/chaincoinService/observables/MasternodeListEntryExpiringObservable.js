const { Observable, Subject } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (chaincoinService) {

  return Observable.create(function (observer) {

    var checkMasternodesLastRunDate = null;
    var masternodeList = null;

    var subscription = chaincoinService.MasternodeList.subscribe(newMasternodeList => {

      if (masternodeList == null) {
        masternodeList = newMasternodeList;
        checkMasternodesLastRunDate = new Date();
        return;
      }

      var runDate = new Date();


      var lastCompareDate = new Date(checkMasternodesLastRunDate.getTime() - (1000 * 60 * 30));
      var compareDate = new Date(runDate.getTime() - (1000 * 60 * 30));

      Object.keys(newMasternodeList).forEach(function(output){

          var nmn = newMasternodeList[output];
          var mn = masternodeList[output];

          if (mn == null) return;

          var nmnlastSeen = new Date(nmn.lastseen * 1000);
          
          if (nmn.status == "ENABLED" && nmnlastSeen < compareDate && nmnlastSeen >= lastCompareDate)
          {
            observer.next({output:output, mn:nmn});
          }
      
      });

      this.checkMasternodesLastRunDate = runDate;
      masternodeList = newMasternodeList;
    });

    return () => {
      subscription.unsubscribe();
    }
  }).pipe(shareReplay({
    bufferSize: 0,
    refCount: true
  }));

};
