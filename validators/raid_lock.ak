use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use common/utils.{get_script_hash}
use raid/types.{RaidDatum}
use raid_lock/validation.{can_claim, can_close}

pub type Redeemer {
  Claim
  Close
}

validator raid_lock(
  admin_pub_key_hash: VerificationKeyHash,
  raid_nft_policy_id: PolicyId,
) {
  spend(
    opt_datum: Option<RaidDatum>,
    redeemr: Redeemer,
    spending_utxo: OutputReference,
    self: Transaction,
  ) {
    expect Some(datum) = opt_datum
    let Transaction { inputs, .. } = self
    let script_hash = get_script_hash(inputs, spending_utxo)
    when redeemr is {
      Claim ->
        can_claim(
          self,
          script_hash,
          admin_pub_key_hash,
          raid_nft_policy_id,
          datum,
        )
      Close -> can_close(self, script_hash, raid_nft_policy_id, datum)
    }
  }

  else(_) {
    fail
  }
}
