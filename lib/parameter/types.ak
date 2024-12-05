use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/address.{Address}

pub type Parameter {
  raid_locker_script_hash: ScriptHash,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
}
