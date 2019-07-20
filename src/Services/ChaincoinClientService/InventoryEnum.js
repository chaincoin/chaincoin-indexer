module.exports = {
    UNDEFINED: 0,
    MSG_TX: 1,
    MSG_BLOCK: 2,
    // The following can only occur in getdata. Invs always use TX or BLOCK.
    MSG_FILTERED_BLOCK: 3,  //!< Defined in BIP37
    MSG_CMPCT_BLOCK: 4,     //!< Defined in BIP152
    
    //TODO: Add these type back in
    /*
    MSG_WITNESS_BLOCK: MSG_BLOCK | MSG_WITNESS_FLAG, //!< Defined in BIP144
    MSG_WITNESS_TX: MSG_TX | MSG_WITNESS_FLAG,       //!< Defined in BIP144
    MSG_FILTERED_WITNESS_BLOCK: MSG_FILTERED_BLOCK | MSG_WITNESS_FLAG,
    */
    
    // Chaincoin message types
    // NOTE: declare non-implmented here in future, we must keep this enum consistent and backwards compatible
    MSG_DEPRECATED: 8,
    MSG_DEPRECATED_01: 10,
    MSG_DEPRECATED_02: 11,
    MSG_MASTERNODE_PAYMENT_VOTE: 12,
    MSG_MASTERNODE_PAYMENT_BLOCK: 13,
    MSG_DEPRECATED_03: 14, // not implemented
    MSG_MASTERNODE_ANNOUNCE: 15,
    MSG_MASTERNODE_PING: 16,
    MSG_DSTX: 17,
    MSG_GOVERNANCE_OBJECT: 18,
    MSG_GOVERNANCE_OBJECT_VOTE: 19,
    MSG_MASTERNODE_VERIFY: 20
}