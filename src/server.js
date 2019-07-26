const  ChaincoinService = require('./Services/chaincoinService/chaincoinService');
const  IndexerService = require('./Services/indexerService/indexerService');
const  MasternodeService = require('./Services/masternodeService/masternodeService');
const  FirebaseService = require('./Services/firebaseService/firebaseService');
//const  MiningService = require('./Services/miningService/miningService');
const  ChaincoinServerService = require('./Services/chaincoinServerService/chaincoinServerService');

const  HttpService = require('./Services/httpService');
const  ChaincoinApi = require('./chaincoinApi');
const  IndexApi = require('./indexApi');



const chaincoinApi = new ChaincoinApi(process.env.chaincoinRpcHost ||"127.0.0.1", process.env.chaincoinRpcPort||8332, process.env.chaincoinRpcUser||"chaincoin", process.env.chaincoinRpcPassword||"vjjbuuy754edvowqbnohc7yjb", process.env.chaincoinRpcThreads||10);
const indexApi = new IndexApi(process.env.MONGODBURL || "mongodb://localhost:27017/");

const chaincoinService = new ChaincoinService(process.env.chaincoinZmq || "tcp://127.0.0.1:38832",chaincoinApi);
chaincoinService.start();

const masternodeService = new MasternodeService(chaincoinService, indexApi);
masternodeService.start();

const indexerService = new IndexerService(chaincoinService, indexApi);
indexerService.start()


const firebaseService = new FirebaseService(chaincoinService, indexerService, indexApi, process.env.firebaseKey);
firebaseService.start();

const chaincoinServerService = new ChaincoinServerService(chaincoinService, indexerService, indexApi, process.env.firebaseKey);
chaincoinServerService.start();

//const miningService = new MiningService(chaincoinApi);
//miningService.start();

const httpService = new HttpService(process.env.httpPort ||8080,chaincoinService,masternodeService,indexerService, firebaseService,null,chaincoinServerService);
httpService.start();





