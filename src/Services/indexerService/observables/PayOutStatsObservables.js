const { Observable, Subject, from } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


module.exports = function (indexerService) { //TODO: not event driven or shared
  return (address, type, unit) => from(indexerService.indexApi.getPayoutsStats(address, type, unit));
};
