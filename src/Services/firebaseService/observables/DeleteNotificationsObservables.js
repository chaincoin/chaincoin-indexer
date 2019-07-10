const { Observable, Subject, from } = require('rxjs');
const { map } = require('rxjs/operators');


module.exports = function (firebaseService) { //TODO: not event driven, should notify others that is has made this change to data
  return (firebaseId) => {
    return from(firebaseService.indexApi.deleteSubscriptions(firebaseId));
  };
};
