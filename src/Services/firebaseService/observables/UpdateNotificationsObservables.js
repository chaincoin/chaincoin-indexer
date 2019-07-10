const { Observable, Subject, from } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (firebaseService) { //TODO: not event driven, should notify others that is has made this change to data
  return (oldFirebaseId, newFirebaseId) => {
    return from(firebaseService.indexApi.updateSubscriptions(oldFirebaseId, newFirebaseId));
  };
};
