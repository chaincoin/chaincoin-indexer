const { Observable, Subject, from } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (firebaseService) {
  return (firebaseId, address, enabled) => {
    return from(enabled?
      firebaseService.indexApi.saveMasternodeSubscription(firebaseId, output):
      firebaseService.indexApi.deleteAddressSubscription(firebaseId, output)
    ).pipe(map(result => {
      firebaseService.SetAddressNotificationEvent.next({firebaseId, address, enabled})
      return result;
    }));
      
  };
};
