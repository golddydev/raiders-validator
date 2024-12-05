use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use parameter_mint/validation.{can_burn, can_mint}

pub type Redeemer {
  Mint
  Burn
}

validator parameter_mint(
  admin_pub_key_hash: VerificationKeyHash,
  parameter_locker_script_hash: ScriptHash,
) {
  mint(redeemr: Redeemer, own_policy_id: PolicyId, self: Transaction) {
    when redeemr is {
      Mint ->
        can_mint(
          self,
          own_policy_id,
          admin_pub_key_hash,
          parameter_locker_script_hash,
        )
      Burn -> can_burn(self, own_policy_id, admin_pub_key_hash)
    }
  }

  else(_) {
    fail
  }
}
