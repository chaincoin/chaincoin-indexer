class MasternodeService{

    

    constructor(getMasternodeListFunc) {
        
        this.getMasternodeListFunc = getMasternodeListFunc;
        this.intervalId = null;

        this.masternodes = null;
        this.checkMasternodesLastRunDate = null;

        this.masternodeEventCallback_new = null;
        this.masternodeEventCallback_removed = null;
        this.masternodeEventCallback_statusChange= null;
        this.masternodeEventCallback_ipAddressChange = null;
        this.masternodeEventCallback_expiring = null;

        this.onError = null;
    }
    


    start()
    {
        if (this.intervalId != null) throw "Service already started";
        this.intervalId = setInterval(()=> this.run, 60000);
    }

    stop()
    {
        if (this.intervalId == null) throw "Service not started";
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    isRunning(){
        return this.intervalId != null;
    }

    async run(){


        try
        {
            var newMasternodes = objectToArray(await this.getMasternodeListFunc());
        
            if (this.masternodes == null){
                this.masternodes = newMasternodes;
                this.checkMasternodesLastRunDate = new Date();
                return;
            } 
    
            var runDate = new Date();
    
    
            this.masternodes.forEach(function(mn){
                var nmn = newMasternodes.find(function(nmn)
                {
                    return nmn.name == mn.name;
                });
    
                if (nmn == null)
                {
                    if (this.masternodeEventCallback_removed != null) this.masternodeEventCallback_removed(mn);
                }
                else 
                {
                    if (nmn.value.status != mn.value.status)
                    {
                        //send the new status
                        if (this.masternodeEventCallback_statusChange != null)this.masternodeEventCallback_statusChange(nmn, mn);
                    }
    
                    if (nmn.value.address != mn.value.address)
                    {
                        if (this.masternodeEventCallback_ipAddressChange != null) this.masternodeEventCallback_ipAddressChange(nmn, mn);
                    }
                }
            });
    
            newMasternodes.forEach(function(nmn){
                var mn = this.masternodes.find(function(mn)
                {
                    return nmn.name == mn.name;
                });
    
                if (mn == null)
                {
                    if (this.masternodeEventCallback_ipAddressChange != null) this.masternodeEventCallback_ipAddressChange(nmn);
                }
            
            });
    
            var lastCompareDate = new Date(checkMasternodesLastRunDate.getTime() - (1000 * 60 * 30));
            var compareDate = new Date(runDate.getTime() - (1000 * 60 * 30));
    
            //Check for expiring MNs
            newMasternodes.forEach(function(nmn){
    
                var mn = this.masternodes.find(function(mn)
                {
                    return nmn.name == mn.name;
                });
    
    
                var nmnlastSeen = new Date(nmn.value.lastseen * 1000);
                
                if (nmn.value.status == "ENABLED" && nmnlastSeen < compareDate && nmnlastSeen >= lastCompareDate)
                {
                    /*indexApi.saveMasternodeEvent({
                        output: nmn.name,
                        time: new Date(),
                        event: "expiringMasternode"
                    });
    
                    indexZmqSock.send(["expiringMasternode",JSON.stringify(nmn)]);*/

                    if (this.masternodeEventCallback_expiring != null) this.masternodeEventCallback_expiring(nmn);
                }
            
            });
    
            this.checkMasternodesLastRunDate = runDate;
            this.masternodes = newMasternodes;
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }

}



var objectToArray = function(obj){

    var result = [];
    for (var key in obj) {
        // skip loop if the property is from prototype
        if (!obj.hasOwnProperty(key)) continue;
        result.push({name:key,value:obj[key]});
    }
    return result;
}


module.exports = MasternodeService;