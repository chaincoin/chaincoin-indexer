var  ChaincoinService = require('./Services/chaincoinService.js');
var  ChaincoinApi = require('./chaincoinApi');



var chaincoinApi = new ChaincoinApi("127.0.0.1",8332, "chaincoin","vjjbuuy754edvowqbnohc7yjb");


var chaincoinService = new ChaincoinService(process.env.chaincoinZmq || "tcp://127.0.0.1:38832",chaincoinApi);
chaincoinService.start();


var sub = chaincoinService.Block("00000000000a38ddcd0734e3e810fc3d607ab4eb6dab3292b9a1e6c4f3db3cb9").subscribe((block) =>{

   
});
/*


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