const { Observable, Subject, from } = require('rxjs');
const { shareReplay, switchMap, map } = require('rxjs/operators');


module.exports = function (chaincoinService) {
  return (hex, allowHighFees) => {
    return from(chaincoinService.chaincoinApi.sendRawTransaction(hex, allowHighFees))
  };
};
