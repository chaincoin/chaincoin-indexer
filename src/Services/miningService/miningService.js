const { Subject, BehaviorSubject  } = require('rxjs');


const zmq = require('zeromq');
const JobManager = require('./MiningLib/jobManager.js');
const util = require('./MiningLib/util.js');

global.algos = require('./MiningLib/algoProperties.js');//TODO: is this needed




//TODO: this needs a re write and event based
class ChaincoinService{

    constructor(chaincoinApi) {
        this.chaincoinApi = chaincoinApi;
        
        this.jobManager = makeJobManager();
        this.extraNonce = 0;

    }
    


    start()
    {
       
        
    }


    stop()
    {
        
    }

    async getMiningHeader(){
        var blockTemplate = await chaincoinApi.getBlockTemplate([{"rules": [ "segwit" ]}]);
        //blockTemplate.target = "0f00000000000000000000000000000000000000000000000000000000000000";
        var pad = function(str, length, padding){
            while(str.length < length)
            {
                str = padding + str
            }
            return str;
        }

        //if (jobManager.currentJob == null) jobManager.processTemplate(blockTemplate);
        if (jobManager.processTemplate(blockTemplate) == false)
        {
            if (jobManager.currentJob.rpcData.curtime + 90 < blockTemplate.curtime)
            {
                jobManager.updateCurrentJob(blockTemplate);
            }
        }

        var currentJob = jobManager.currentJob;



        var extraNonce1 = pad(extraNonce.toString(16),8,"0"); //8 hex or 4 bytes
        var extraNonce2 = pad("0",8,"0"); //8 hex or 4 bytes
        var nTime = currentJob.rpcData.curtime.toString(16); //8 hex or 4 bytes
        var nonce = pad("12345678",8,"0"); //8 hex or 4 bytes
        var blockHeader = jobManager.generateHeader(currentJob.jobId, extraNonce1, extraNonce2, nTime, nonce);



        var blockHeaderHex = blockHeader.headerBuffer.toString("hex");

        var result = {
            jobId: currentJob.jobId,
            blockHeaderHex:blockHeaderHex,
            blockHeaderTestHash: blockHeader.headerHash.reverse().toString("hex"),
            extraNonce: this.extraNonce,
            nonceRange: blockTemplate.noncerange,
            target: blockTemplate.target,
            time: currentJob.rpcData.curtime
        }
        

        this.extraNonce = this.extraNonce + 1;
        if (this.extraNonce >= 2147483648) this.extraNonce = 0;
        return result;
    }

    async submitBlock(jobId, time, nonce, extraNonce)
    {
        console.log("Attempting to submit block - 1");
    
        try
        {
            console.log("Attempting to submit block data - jobId = " + jobId + " " + time + " " + nonce + " " + extraNonce);
    
            var job = this.jobManager.validJobs[jobId];
            
            var pad = function(str, length, padding){
                while(str.length < length)
                {
                    str = padding + str
                }
                return str;
            }
    
    
    
            var extraNonce1 = pad(extraNonce.toString(16),8,"0"); //8 hex or 4 bytes
            var extraNonce2 = pad("0",8,"0"); //8 hex or 4 bytes
            var _nonce = pad(nonce.toString(16),8,"0"); //8 hex or 4 bytes
            var nTime = time.toString(16); //8 hex or 4 bytes
            
            var result = this.jobManager.processShare(jobId, 0, 0, extraNonce1, extraNonce2, nTime, _nonce, "127.0.0.1", "9999", "test");
            console.log("Attempting to submit block - 7 - error = " + JSON.stringify(result.error));
    
            if (result.result == true && result.blockHex != null)
            {
                var submitResult = await this.chaincoinApi.submitBlock(result.blockHex);
                if (submitResult == true) console.log("submit block to chaincoin api successful");
                else console.log("submit block to chaincoin api failed");
                
                return {
                    result: submitResult,
                    blockHash: result.blockHash
                };
            }
            else if (result.result == true && result.blockHex == null)
            {
                console.log("Share received");
                return {}
            }
            else if (result.error != null)
            {
                console.log("bad block, error - " + result.error);
                return {}
            }
            else
            {
                console.log("bad block");
                return {}
            }
        }
        catch(ex)
        {
            console.log(ex);
        }
        
    }

}
module.exports = ChaincoinService;

const makeJobManager = () =>{
    var jobManagerParams = {
        coin:{
            algorithm: "c11",
            txMessages:"Mcna",
        },
        address: "chc1qy2n9qmvp3j6ew2k0prqk2q7h9j3e8wrlgmyea2",
        network:{
            messagePrefix: '\x18Bitcoin Signed Message:\n',
            bech32: 'chc',
            bip32: {
              public: 0x02FE52F8,
              private: 0x02FE52CC
            },
            pubKeyHash: 0x1C,
            scriptHash: 0x04,
            wif: 0x80
        }
    };
    
    //Test
    if (process.env.jobManagerParams == "test")
    {
        jobManagerParams = {
            coin:{
                algorithm: "c11",
                txMessages:"Mcna",
            },
            address: "tchc1qq03kpt3xpw0vdg6n03g3xurd776g98aclljeph",
            network:{
                messagePrefix: '\x18Bitcoin Signed Message:\n',
                bech32: 'tchc',
                bip32: {
                  public: 0x02FE52F8,
                  private: 0x02FE52CC
                },
                pubKeyHash: 0x50,
                scriptHash: 0x2c,
                wif: 0xd8
            }
        };
    }

    jobManagerParams.poolAddressScript = util.addressToScript(jobManagerParams.network,jobManagerParams.address);
    jobManagerParams.recipients = [];

    return new JobManager(jobManagerParams);
}