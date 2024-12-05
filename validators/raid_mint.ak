use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}
use raid_mint/validation.{can_burn, can_create}

pub type Redeemer {
  /// price is lovelace of each bounty
  Create { quantity: Int, price: Int }
  Remove
}

validator raid_mint(parameter_nft_policy_id: PolicyId) {
  mint(redeemr: Redeemer, own_policy_id: PolicyId, self: Transaction) {
    when redeemr is {
      Create { quantity, price } ->
        can_create(
          self,
          own_policy_id,
          parameter_nft_policy_id,
          quantity,
          price,
        )
      Remove -> can_burn(self, own_policy_id)
    }
  }

  else(_) {
    fail
  }
}
