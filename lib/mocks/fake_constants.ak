use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/address.{Address}
use cardano/addresses
use cardano/assets.{PolicyId}

pub const parameter_locker_script_hash: ScriptHash =
  #"00000000000000000000000000000000000000000000000000000011"

pub const raid_locker_script_hash: ScriptHash =
  #"00000000000000000000000000000000000000000000000000000010"

pub const parameter_token_policy_id: PolicyId =
  #"00000000000000000000000000000000000000000000000000000005"

pub const raid_nft_policy_id: PolicyId =
  #"00000000000000000000000000000000000000000000000000000006"

pub const admin_pub_key_hash: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000033"

pub fn project_address() -> Address {
  addresses.create_address(#"1234", #"")
}

pub const authorizer_pub_key_hash1: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000050"

pub const authorizer_pub_key_hash2: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000051"

pub fn authorizers_pub_key_hashes() -> List<VerificationKeyHash> {
  [authorizer_pub_key_hash1, authorizer_pub_key_hash2]
}

pub const fee_percentage: Int = 20
