use aiken/collection/dict
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/interval
use cardano/address.{Address}
use cardano/addresses
use cardano/assets.{AssetName, PolicyId, Value}
use cardano/transaction.{Datum,
  InlineDatum, Input, NoDatum, Output, Transaction}
use mocks/fake_constants.{
  parameter_locker_script_hash, parameter_token_policy_id,
}
use parameter/types.{Parameter} as p_types
use raid/types.{RaidDatum}
use tests/fake_tx.{test_out_ref}

pub fn user_address() -> Address {
  addresses.create_address(#"5678", #"")
}

fn parameter_locker_address(parameter_locker_script_hash: ScriptHash) -> Address {
  addresses.create_script_address(parameter_locker_script_hash, #"")
}

fn raid_locker_script_address(raid_locker_script_hash: ScriptHash) -> Address {
  addresses.create_script_address(raid_locker_script_hash, #"")
}

pub fn creator_pub_key_hash() -> VerificationKeyHash {
  #"1234"
}

pub fn creator_address() -> Address {
  addresses.create_address(creator_pub_key_hash(), #"")
}

pub fn build_parameter_datum(
  raid_locker_script_hash: ScriptHash,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
) -> Datum {
  InlineDatum(
    Parameter(
      raid_locker_script_hash,
      project_address,
      fee_percentage,
      authorizers_pub_key_hashes,
    ),
  )
}

pub fn build_raid_datum(
  quantity: Int,
  price: Int,
  creator: VerificationKeyHash,
) -> Datum {
  InlineDatum(RaidDatum(quantity, price, creator))
}

pub fn make_parameter_reference_input(
  raid_locker_script_hash: ScriptHash,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
) -> Input {
  Input(
    test_out_ref(),
    Output(
      parameter_locker_address(parameter_locker_script_hash),
      assets.zero
        |> assets.add(parameter_token_policy_id, "parameter_token_asset_name", 1),
      build_parameter_datum(
        raid_locker_script_hash,
        project_address,
        fee_percentage,
        authorizers_pub_key_hashes,
      ),
      None,
    ),
  )
}

pub fn parameter_token_output(
  parameter_locker_script_hash: ScriptHash,
  parameter_token_policy_id: PolicyId,
  parameter_token_asset_name: AssetName,
  raid_locker_script_hash: ScriptHash,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
) -> Output {
  Output(
    parameter_locker_address(parameter_locker_script_hash),
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, 1),
    build_parameter_datum(
      raid_locker_script_hash,
      project_address,
      fee_percentage,
      authorizers_pub_key_hashes,
    ),
    None,
  )
}

pub fn parameter_token_input(
  parameter_locker_script_hash: ScriptHash,
  parameter_token_policy_id: PolicyId,
  parameter_token_asset_name: AssetName,
  raid_locker_script_hash: ScriptHash,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
) -> Input {
  Input(
    test_out_ref(),
    parameter_token_output(
      parameter_locker_script_hash,
      parameter_token_policy_id,
      parameter_token_asset_name,
      raid_locker_script_hash,
      project_address,
      fee_percentage,
      authorizers_pub_key_hashes,
    ),
  )
}

pub fn raid_nft_output(
  raid_locker_script_hash: ScriptHash,
  raid_nft_policy_id: PolicyId,
  raid_nft_asset_name: AssetName,
  bounty_locked: Int,
  output_datum: Datum,
) -> Output {
  Output(
    raid_locker_script_address(raid_locker_script_hash),
    assets.from_lovelace(bounty_locked)
      |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1),
    output_datum,
    None,
  )
}

pub fn raid_nft_input(
  raid_locker_script_hash: ScriptHash,
  raid_nft_policy_id: PolicyId,
  raid_nft_asset_name: AssetName,
  bounty_locked: Int,
  output_datum: Datum,
) -> Input {
  Input(
    test_out_ref(),
    raid_nft_output(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      output_datum,
    ),
  )
}

pub fn project_output(project_address: Address, fee: Int) -> Output {
  Output(project_address, assets.from_lovelace(fee), NoDatum, None)
}

pub fn user_claimed_output(price: Int) -> Output {
  Output(user_address(), assets.from_lovelace(price), NoDatum, None)
}

pub fn make_transaction(
  inputs: List<Input>,
  reference_inputs: List<Input>,
  outputs: List<Output>,
  mint: Value,
  signers: List<VerificationKeyHash>,
) -> Transaction {
  Transaction {
    inputs,
    reference_inputs,
    outputs,
    fee: 0,
    mint,
    certificates: [],
    withdrawals: [],
    validity_range: interval.everything,
    extra_signatories: signers,
    redeemers: [],
    datums: dict.empty,
    id: #"0000000000000000000000000000000000000000000000000000000000000000",
    votes: [],
    proposal_procedures: [],
    current_treasury_amount: None,
    treasury_donation: None,
  }
}
