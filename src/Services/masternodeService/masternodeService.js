var  { Subject } = require('rxjs');

class MasternodeService{

    

    constructor(chaincoinService, indexApi) {
        this.chaincoinService = chaincoinService;
        this.indexApi = indexApi;

        
        this.onError = null;
        this.masternodeListEntryAddedSubscription = null;
        this.masternodeListEntryRemovedSubscription = null;
        this.masternodeListEntryStatusChangedSubscription = null;
        this.masternodeListEntryExpiringSubscription = null;

        this.newMasternodeEvent = new Subject();

        
        this.Masternode = require('./observables/MasternodeObservables')(this);
        this.MasternodeEvent = require('./observables/MasternodeEventObservables')(this);
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

    async saveMasternodeEvent(mnEvent)
    {
        try
        {
            await this.indexApi.saveMasternodeEvent({
                output: mnListEntry.output,
                time: new Date(),
                event: "newMasternode"
            });

            this.newMasternodeEvent.next(mnEvent);
        }
        catch(ex)
        {
            if (this.onError != null) this.onError(ex);
            else console.log(ex);
        }
    }

    processMasternodeListEntryAdded(mnListEntry){

        this.saveMasternodeEvent({
            output: mnListEntry.output,
            time: new Date(),
            event: "newMasternode"
        });
        
    }

    processMasternodeListEntryRemoved(mnListEntry){

        this.saveMasternodeEvent({
            output: mnListEntry.output,
            time: new Date(),
            event: "removedMasternode"
        });
    }

    processMasternodeListEntryStatusChanged(mnListEntry){
        this.saveMasternodeEvent({
            output: mnListEntry.output,
            time: new Date(),
            event: "changedMasternode",
            oldStatus: mnListEntry.oldState.status,
            newStatus: mnListEntry.newState.status
        });  
    }


    processMasternodeListEntryExpiring(mnListEntry){

        this.saveMasternodeEvent({
            output: mnListEntry.output,
            time: new Date(),
            event: "expiringMasternode"
        });  
    }

}




module.exports = MasternodeService;