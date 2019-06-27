const { Observable, Subject, BehaviorSubject  } = require('rxjs');
const { shareReplay } = require('rxjs/operators');


const zmq = require('zeromq');



class ChaincoinService{

    constructor(chaincoinZmq, chaincoinApi) {
        this.chaincoinApi = chaincoinApi;
        this.chaincoinZmq = chaincoinZmq;
        this.chaincoinZmqSock = null;
     

        this.chaincoinZmqSockConnect = new BehaviorSubject();
        this.chaincoinZmqSockMessage = new Subject();


        this.NewBlockHash = require('../observables/NewBlockHashObservable')(this);
        this.NewTransactionHash = require('../observables/NewTransactionHashObservable')(this);


        this.BestBlockHash = require('../observables/BestBlockHashObservable')(this);
        this.BlockchainInfo = require('../observables/BlockchainInfoObservable')(this);
        this.BlockCount = require('../observables/BlockCountObservable')(this);
        this.ChainTxStats = require('../observables/ChainTxStatsObservable')(this);
        this.Difficulty = require('../observables/DifficultyObservable')(this);
        this.NetworkHashps = require('../observables/NetworkHashpsObservable')(this);
        this.TxOutSetInfo = require('../observables/TxOutSetInfoObservable')(this);
        

        this.PeerInfo = require('../observables/PeerInfoObservable')(this);
        this.ConnectoinCount = require('../observables/ConnectionCountObservable')(this);

        this.MasternodeList = require('../observables/MasternodeListObservable')(this);
        this.MasternodeCount = require('../observables/MasternodeCountObservable')(this);

        this.MasternodeWinners = require('../observables/MasternodeWinnersObservable')(this);

        this.MemPoolInfo = require('../observables/MemPoolInfoObservable')(this);

        this.EstimateSmartFee = require('../observables/EstimateSmartFeeObservable')(this);


        this.Block = require('../observables/BlockObservables')(this);
        this.BlockHash = require('../observables/BlockHashObservables')(this);

        this.Transaction = require('../observables/TransactionObservables')(this);
    }
    


    start()
    {
        if (this.chaincoinZmqSock != null) throw "Service already started";
        this.chaincoinZmqSock = zmq.socket('sub');
        this.chaincoinZmqSock.connect(this.chaincoinZmq);
        //this.chaincoinZmqSock.subscribe('pubhashblock');
        //this.chaincoinZmqSock.subscribe('pubhashtx');
        //this.chaincoinZmqSock.subscribe('hashblock');
        //this.chaincoinZmqSock.subscribe('hashtx');

        this.chaincoinZmqSock.on('message', (topic, message, sequence) =>  {

            var topic = topic.toString('utf8');
            var sequence = sequence.readUInt32LE();


            this.chaincoinZmqSockMessage.next({
                topic,
                message,
                sequence
            });
            
        });   

        this.chaincoinZmqSockConnect.next(true);
        
    }


    stop()
    {
        if (this.chaincoinZmqSock == null) throw "Service not started";
        this.chaincoinZmqSock.zmq_disconnect();
        this.chaincoinZmqSock = null;
        this.chaincoinZmqSockConnect.next(false);
    }


  }
  module.exports = ChaincoinService;

/*
  var processObservable = (observableClass, chaincoinService) =>{

    var observable = null;

    return Observable.create(function (observer) {

        if (observable == null)
        {
            observable = 
        }

        return () => {

        }
      });

  }*/