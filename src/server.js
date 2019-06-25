var  ChaincoinService = require('./chaincoinService.js');
var  ChaincoinApi = require('./chaincoinApi');



var chaincoinApi = new ChaincoinApi("127.0.0.1",8332, "chaincoin","vjjbuuy754edvowqbnohc7yjb");


var chaincoinService = new ChaincoinService(process.env.chaincoinZmq || "tcp://127.0.0.1:38832",chaincoinApi);
chaincoinService.start();




chaincoinService.BestBlockHash.subscribe((bestBlockHash) =>{

});

chaincoinService.BlockchainInfo.subscribe((BlockchainInfo) =>{
    debugger;
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
    debugger;
});

