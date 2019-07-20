const crypto = require('crypto');
const net = require('net');

const { Subject } = require("rxjs");


const BufferReader = require('./BufferReader');
const BufferWriter = require('./BufferWriter');

const VersionMessage = require("./Message/VersionMessage");
const VersionAckMessage = require("./Message/VersionAckMessage");

const SendHeadersMessage = require("./Message/SendHeadersMessage");
const InventoryMessage = require("./Message/InventoryMessage");

const MasternodeListRequestMessage = require("./Message/MasternodeListRequestMessage");
const MasternodePingMessage = require("./Message/MasternodePingMessage");
const MasternodeBroadcastMessage = require("./Message/MasternodeBroadcastMessage");


const PingMessage = require("./Message/PingMessage");
const PongMessage = require("./Message/PongMessage");

const RejectMessage = require("./Message/RejectMessage");


module.exports = class ChaincoinClient {

    constructor(ip, port){

        this.onData = this.onData.bind(this);



        this.ip = ip;
        this.port = port;
        
        this.client = new net.Socket();

        this.client.on('data', this.onData);
        this.client.on('close',this.onClose);

        this.magic = 58380963;
        this.magicBuffer = Buffer.alloc(4);//Buffer.from("a3d27a03", "hex");
        this.magicBuffer.writeUInt32LE(this.magic);
        
        this.dataBuffer = Buffer.alloc(0);

        this.newMessage = new Subject();
        
        this.mnList = {

        };
    }

    connect(){
        this.client.connect(this.port, this.ip, () => {
            console.log('Connected');
            //client.write('Hello, server! Love, Client.');

            var versionMessage = new VersionMessage(
                70015,
                BigInt(1), 
                BigInt(new Date().getUnixTime()),
                null,
                null,
                BigInt(1393780771635895773n),
                "/Mcna-0.0.1/",
                1,
                false
            );

            this.sendMessage(versionMessage);
        });
    }

    sendMessage(message){

        this.client.write(this.magicBuffer);

        var command = message.getCommand();
        var commandBuffer = Buffer.alloc(12);
        for(var i = 0; i < 12; i++)
        {
            if (command.length > i) commandBuffer.writeUInt8(command.charCodeAt(i), i);
            else commandBuffer.writeUInt8(0,i);
        }
        this.client.write(commandBuffer);



        var payLoad = message.getPayLoadBuffer();

        var length = Buffer.alloc(4);
        length.writeUInt32LE(payLoad.length); 
        this.client.write(length);

        var payloadFirstHash = crypto.createHash('sha256').update(payLoad).digest();
        var payloadSecondHash = crypto.createHash('sha256').update(payloadFirstHash).digest();

        var checkSum = payloadSecondHash.slice(0,4);
        //checkSum.writeUInt32BE(payloadSecondHash.readUInt32BE());        
        this.client.write(checkSum);

        this.client.write(payLoad);
    }

    toMessage(command, bufferReader){

        console.log("command: " + command);

        if (command == "version")
        {
            var version = bufferReader.readInt32LE();
            var services = bufferReader.readBigUInt64LE();
            var timestamp = bufferReader.readBigInt64LE();
    
    
            //addrRecv
            {
                var addrRecvService = bufferReader.readBigUInt64LE(); 
    
                //Ip v4 marker
                var addrRecvIpV4Marker1 = bufferReader.readUInt32LE();
                var addrRecvIpV4Marker2 = bufferReader.readUInt32LE();
                var addrRecvIpV4Marker3 = bufferReader.readUInt32LE();
                //buffer.writeUInt32LE(0, 28); 
                //buffer.writeUInt32LE(4294901760, 32); 
    
                //Ip v4 octecs
                var addrRecvIpV4 = bufferReader.readUInt32LE();
                var addrRecvPort = bufferReader.readUInt16BE();
            }
           
    
            //addrFrom
            {
                
                var addrFromService = bufferReader.readBigUInt64LE(); 
    
                //Ip v4 marker
                var addrFromIpV4Marker1 = bufferReader.readUInt32LE();
                var addrFromIpV4Marker2 = bufferReader.readUInt32LE();
                var addrFromIpV4Marker3 = bufferReader.readUInt32LE();
                //buffer.writeUInt32LE(0, 28); 
                //buffer.writeUInt32LE(4294901760, 32); 
    
                //Ip v4 octecs
                var addrFromIpV4 = bufferReader.readUInt32LE();
                var addrFromPort = bufferReader.readUInt16BE();
            }
    
    
    
            //buffer.writeBigInt64LE(this.addrRecv, 42);
            var nonce = bufferReader.readBigUInt64LE();
            var userAgent = bufferReader.readVarString();            

            var startHeight = bufferReader.readInt32LE();
            var relay = bufferReader.readUInt8() == 1 ? true : false;

            return new VersionMessage(version,services,timestamp,"","",nonce,userAgent,startHeight,relay); 
        }

        if (command == "verack")
        {
            return new VersionAckMessage();
        }


        if (command == "sendheaders")
        {
            return new SendHeadersMessage();
        }
        

        if (command == "inv")
        {
            var vectorCount = bufferReader.readVarInt();

            var inventoryVectors = [];
            for(var i = 0; i < vectorCount; i++)
            {
                inventoryVectors.push(bufferReader.readInvVec());
            }
            
            return new InventoryMessage(inventoryVectors);
        }


        if (command == "mnb")
        {
            var masternodeOutPoint = bufferReader.readOutPoint();
            var address = bufferReader.readService();

            var payee = bufferReader.readVarBuffer(); 
            var pubKeyCollateralAddress = bufferReader.readVarBuffer();
            var pubKeyMasternode = bufferReader.readVarBuffer();


            var sig = bufferReader.readVarBuffer();
           
            var sigTime = bufferReader.readBigInt64LE();
            var nProtocolVersion = bufferReader.readInt32LE();

            var lastPing = this.toMessage("mnp", bufferReader);
            
            
            return new MasternodeBroadcastMessage(masternodeOutPoint, payee, address, pubKeyCollateralAddress, pubKeyMasternode, sig, sigTime, nProtocolVersion, lastPing);
        }

        if (command == "mnp")
        {
            var mnOutPoint = bufferReader.readOutPoint();
            var blockHash = bufferReader.readHash();
            var sigTime = bufferReader.readBigInt64LE();

            var vchSig = bufferReader.readVarBuffer();
            var fSentinelIsCurrent = bufferReader.readBool();
            var nSentinelVersion = bufferReader.readUInt32LE();
            var nDaemonVersion = bufferReader.readUInt32LE();
            
            return new MasternodePingMessage(mnOutPoint, blockHash, sigTime, vchSig, fSentinelIsCurrent, nSentinelVersion, nDaemonVersion);
        }

        if (command == "ping")
        {
            var nonce = bufferReader.readBigUInt64LE();
            return new PingMessage(nonce);
        }

        if (command == "pong")
        {
            var nonce = bufferReader.readBigUInt64LE();
            return new PongMessage(nonce);
        }

        if (command == "reject")
        {
            var message = bufferReader.readVarString();
            var ccode = bufferReader.readString(1);
            var reason = bufferReader.readVarString();
            var data = bufferReader.remainingBuffer();

            return new RejectMessage(message,ccode,reason,data);
        }
    }

    processMessage(message)
    {
        if (message instanceof VersionMessage) {
            this.sendMessage(new VersionAckMessage());
            this.sendMessage(new MasternodeListRequestMessage(null));
        }
        if (message instanceof PingMessage) this.sendMessage(new PongMessage(message.nonce));

        if (message instanceof MasternodePingMessage) {
            var broadcast = this.mnList[message.masternodeOutPoint.output];
            if (broadcast != null)
            {
                broadcast.lastPing = message;
            }
        };

        if (message instanceof MasternodeBroadcastMessage) {
            this.mnList[message.masternodeOutPoint.output] = message;
        };


        this.newMessage.next(message);
    }



    onData(dataBuffer){

        this.dataBuffer = Buffer.concat([this.dataBuffer,dataBuffer]);

        while(true)
        {
            //Not enough bytes for a packet header
            if (this.dataBuffer.length < 24) return;

            var bufferReader = new BufferReader(this.dataBuffer);

            var requestMagic = bufferReader.readUInt32LE();
            if (requestMagic != this.magic)
            {
                //TODO: wrong magic
            }

            var command = bufferReader.readString(12);

            var length = bufferReader.readUInt32LE();
            var checkSum = bufferReader.readUInt32LE();

            //Not enough bytes for a packet and payload
            if (bufferReader.remainingLength() < length) return;

            var payload = bufferReader.readBuffer(length);

            var payloadFirstHash = crypto.createHash('sha256').update(payload).digest();
            var payloadSecondHash = crypto.createHash('sha256').update(payloadFirstHash).digest();


            this.dataBuffer = bufferReader.remainingBuffer();

            if (payloadSecondHash.readUInt32LE() == checkSum)
            {
                var message = this.toMessage(command, new BufferReader(payload));

                this.processMessage(message);
            }

           
        }
    }

    onClose(){

    }

}



Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };