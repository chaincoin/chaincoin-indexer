var  ChaincoinService = require('./Services/chaincoinService/chaincoinService');
var  MasternodeService = require('./Services/masternodeService/masternodeService');
var  HttpService = require('./Services/httpService');
var  ChaincoinApi = require('./chaincoinApi');
var  IndexApi = require('./indexApi');



var chaincoinApi = new ChaincoinApi("127.0.0.1",8332, "chaincoin","vjjbuuy754edvowqbnohc7yjb");
var indexApi = new IndexApi(process.env.MONGODBURL || "mongodb://localhost:27017/");

var chaincoinService = new ChaincoinService(process.env.chaincoinZmq || "tcp://127.0.0.1:38832",chaincoinApi);
chaincoinService.start();

var masternodeService = new MasternodeService(chaincoinService, indexApi);
masternodeService.start();


var httpService = new HttpService(8080,chaincoinService,masternodeService);
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