const { Observable, Subject, from } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (firebaseService) {
  return (firebaseId, enabled) => {
    return from(enabled?
      firebaseService.indexApi.saveMasternodeSubscription(firebaseId):
      firebaseService.indexApi.deleteAddressSubscription(firebaseId)
    ).pipe(map(result => {
      firebaseService.SetBlockNotificationEvent.next({firebaseId, enabled})
      return result;
    }));
      
  };
};
