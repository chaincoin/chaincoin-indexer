const { Observable, Subject, from } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (firebaseService) {
  return (firebaseId, output, enabled) => {
    return from(enabled?
      firebaseService.indexApi.saveMasternodeSubscription(firebaseId, output):
      firebaseService.indexApi.deleteMasternodeSubscription(firebaseId, output)
    )/*.pipe(map(
      firebaseService.SetMasternodeNotificationEvent.next({firebaseId, output, enabled})
    ))*/;
  };
};
