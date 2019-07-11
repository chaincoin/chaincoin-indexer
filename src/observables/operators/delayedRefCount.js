const { Observable, ConnectableObservable, Subscription, async } = require('rxjs');


/* This operator makes more sense when used with .publishReplay(1), as example below:
 *
 *     let some$ = Observable.create(observer => {
 *         console.log(1110);
 *         observer.next('a value');
 *     });
 *     this.obs$ = refCountWithDelay(some$.publishReplay(1), 0, 2000);
 *
 * in such case above, '1110' will print only 2000 ms after all subscriptions
 * were unsubscribed.
 * 
 * authors: https://github.com/Dorus and https://github.com/babeal
 */
module.exports = function refCountWithDelay(source, attachTime, detachTime, scheduler) {
    attachTime = attachTime || 0;
    detachTime = detachTime || 0;
    scheduler = scheduler || async;
    var connected = 0; // 0 = disconnected, 1 = disconnecting, 2 = connecting, 3 = connected
    var refCount = 0;
    var con = Subscription.EMPTY;
    var sched = Subscription.EMPTY;

    return Observable.create(ob => {
        source.subscribe(ob);
        if (refCount++ === 0) {
            if (connected === 1) {
                connected = 3;
                sched.unsubscribe();
            } else { // connected === 0
                connected = 2;
                sched = scheduler.schedule(() => { 
                    con = source.connect(); 
                    connected = 3; 
                }, attachTime);
            }
        }
        return () => {
            if (--refCount === 0) {
                if (connected === 2) {
                    connected = 0;
                    sched.unsubscribe();
                } else { // connected === 3
                    connected = 1;
                    sched = scheduler.schedule(() => { con.unsubscribe(); connected = 0; }, detachTime)
                }
            }
        };
    });
}