var  ChaincoinService = require('./Services/chaincoinService/chaincoinService');
var  IndexerService = require('./Services/indexerService/indexerService');
var  MasternodeService = require('./Services/masternodeService/masternodeService');
var  FirebaseService = require('./Services/firebaseService/firebaseService');
//var  MiningService = require('./Services/miningService/miningService');
var  HttpService = require('./Services/httpService');
var  ChaincoinApi = require('./chaincoinApi');
var  IndexApi = require('./indexApi');



var chaincoinApi = new ChaincoinApi(process.env.chaincoinRpcHost ||"127.0.0.1", process.env.chaincoinRpcPort||8332, process.env.chaincoinRpcUser||"chaincoin", process.env.chaincoinRpcPassword||"vjjbuuy754edvowqbnohc7yjb");
var indexApi = new IndexApi(process.env.MONGODBURL || "mongodb://localhost:27017/");

var chaincoinService = new ChaincoinService(process.env.chaincoinZmq || "tcp://127.0.0.1:38832",chaincoinApi);
chaincoinService.start();

var masternodeService = new MasternodeService(chaincoinService, indexApi);
masternodeService.start();

var indexerService = new IndexerService(chaincoinService, indexApi);
indexerService.start()


var firebaseService = new FirebaseService(chaincoinService, indexerService, indexApi, process.env.firebaseKey);
firebaseService.start();

//var miningService = new MiningService(chaincoinApi);
//miningService.start();

var httpService = new HttpService(process.env.httpPort ||8080,chaincoinService,masternodeService,indexerService, firebaseService, /*miningService*/);
httpService.start();






/*
var sub = chaincoinService.Block("00000000000a38ddcd0734e3e810fc3d607ab4eb6dab3292b9a1e6c4f3db3cb9").subscribe((block) =>{

   
});



chaincoinService.NewBlockHash.subscribe((NewBlockHash) =>{

    
});

chaincoinService.NewTransactionHash.subscribe((NewTransactionHash) =>{

});

chaincoinService.BestBlockHash.subscribe((bestBlockHash) =>{

});

chaincoinService.BlockchainInfo.subscribe((BlockchainInfo) =>{

});


chaincoinService.BlockCount.subscribe((bestBlockHash) =>{
    
});

chaincoinService.ChainTxStats.subscribe((ChainTxStats) =>{
  
});

chaincoinService.Difficulty.subscribe((Difficulty) =>{

});

chaincoinService.NetworkHashps.subscribe((NetworkHashps) =>{

});

chaincoinService.TxOutSetInfo.subscribe((TxOutSetInfo) =>{

});
*/