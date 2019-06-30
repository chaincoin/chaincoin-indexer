class MasternodeService{

    

    constructor(chaincoinService) {
        this.chaincoinService = chaincoinService;

        this.onError = null;
        this.masternodeListEntryAddedSubscription = null;
        this.masternodeListEntryRemovedSubscription = null;
        this.masternodeListEntryStatusChangedSubscription = null;
    }
    


    start()
    {
        if (this.masternodeListEntryAddedSubscription != null) throw "Service already started";
        this.masternodeListEntryAddedSubscription = this.chaincoinService.MasternodeListEntryAdded.subscribe(this.processMasternodeListEntryAdded);
        this.masternodeListEntryRemovedSubscription = this.chaincoinService.MasternodeListEntryRemoved.subscribe(this.processMasternodeListEntryRemoved);
        this.masternodeListEntryStatusChangedSubscription = this.chaincoinService.MasternodeListEntryStatusChanged.subscribe(this.processMasternodeListEntryStatusChanged);
        this.masternodeListEntryExpiringSubscription = this.chaincoinService.MasternodeListEntryExpiring.subscribe(this.processMasternodeListEntryExpiring);
    }

    stop()
    {
        if (this.masternodeListEntryAddedSubscription == null) throw "Service not started";
        this.masternodeListEntryAddedSubscription.unsubscribe();
        this.masternodeListEntryAddedSubscription = null;

        this.masternodeListEntryRemovedSubscription.unsubscribe();
        this.masternodeListEntryRemovedSubscription = null;

        this.masternodeListEntryStatusChangedSubscription.unsubscribe();
        this.masternodeListEntryStatusChangedSubscription = null;

        this.masternodeListEntryExpiringSubscription.unsubscribe();
        this.masternodeListEntryExpiringSubscription = null;
    }

    isRunning(){
        return this.masternodeListEntryAddedSubscription != null;
    }

    async processMasternodeListEntryAdded(mnListEntry){
        try
        {
            debugger;
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }

    async processMasternodeListEntryRemoved(mnListEntry){
        try
        {
            debugger;
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }

    async processMasternodeListEntryStatusChanged(mnListEntry){
        try
        {
            debugger;
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }


    async processMasternodeListEntryExpiring(mnListEntry){
        try
        {
            debugger;
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }

}




module.exports = MasternodeService;