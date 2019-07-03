const { Observable, Subject, from } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: not event driven or shared
  return (pos,pageSize) => from(indexerService.indexApi.getRichList(pos,pageSize));
};
