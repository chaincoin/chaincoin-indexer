class MasternodeService{

    

    constructor(chaincoinService, indexApi) {
        this.chaincoinService = chaincoinService;

        this.onError = null;
        this.masternodeListEntryAddedSubscription = null;
        this.masternodeListEntryRemovedSubscription = null;
        this.masternodeListEntryStatusChangedSubscription = null;

        this.indexApi = indexApi;
    }
    


    start()
    {
        if (this.masternodeListEntryAddedSubscription != null) throw "Service already started";
        this.masternodeListEntryAddedSubscription = this.chaincoinService.MasternodeListEntryAdded.subscribe((mnEntry) => this.processMasternodeListEntryAdded(mnEntry));
        this.masternodeListEntryRemovedSubscription = this.chaincoinService.MasternodeListEntryRemoved.subscribe((mnEntry) => this.processMasternodeListEntryRemoved(mnEntry));
        this.masternodeListEntryStatusChangedSubscription = this.chaincoinService.MasternodeListEntryStatusChanged.subscribe((mnEntry) => this.processMasternodeListEntryStatusChanged(mnEntry));
        this.masternodeListEntryExpiringSubscription = this.chaincoinService.MasternodeListEntryExpiring.subscribe((mnEntry) => this.processMasternodeListEntryExpiring(mnEntry));
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
            await this.indexApi.connect();

            await this.indexApi.saveMasternodeEvent({
                output: mnListEntry.output,
                time: new Date(),
                event: "newMasternode"
            });
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
            await this.indexApi.connect();

            await this.indexApi.saveMasternodeEvent({
                output: mnListEntry.output,
                time: new Date(),
                event: "removedMasternode"
            });
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
            await this.indexApi.connect();

            await this.indexApi.saveMasternodeEvent({
                output: mnListEntry.output,
                time: new Date(),
                event: "changedMasternode",
                oldStatus: mnListEntry.oldState.status,
                newStatus: mnListEntry.newState.status
            });
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
            await this.indexApi.connect();

            await this.indexApi.saveMasternodeEvent({
                output: mnListEntry.output,
                time: new Date(),
                event: "expiringMasternode"
            });
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
        
    }

}




module.exports = MasternodeService;