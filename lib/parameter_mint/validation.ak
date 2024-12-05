use aiken/cbor.{diagnostic}
use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/primitive/string
use cardano/assets.{AssetName, PolicyId, Value}
use cardano/transaction.{Output, Transaction, find_script_outputs}
use common/utils.{
  get_first_output_reference, get_unique_token_name, trace_if_false,
}

pub fn can_mint(
  tx: Transaction,
  own_policy_id: PolicyId,
  admin_pub_key_hash: VerificationKeyHash,
  parameter_locker_script_hash: ScriptHash,
) -> Bool {
  let Transaction { inputs, outputs, mint, extra_signatories: signers, .. } = tx
  let first_output_ref = get_first_output_reference(inputs)
  let unique_asset_name = get_unique_token_name(first_output_ref)

  and {
    check_admin_signed(signers, admin_pub_key_hash),
    check_minted_token(mint, own_policy_id, unique_asset_name),
    check_paramter_locked(
      outputs,
      own_policy_id,
      unique_asset_name,
      parameter_locker_script_hash,
    ),
  }
}

pub fn can_burn(
  tx: Transaction,
  own_policy_id: PolicyId,
  admin_pub_key_hash: VerificationKeyHash,
) -> Bool {
  let Transaction { mint, extra_signatories: signers, .. } = tx
  let is_burn_valid =
    when
      mint
        |> assets.tokens(own_policy_id)
        |> dict.to_pairs
    is {
      [asset] -> {
        let Pair(_, amount) = asset
        amount == -1
      }
      _ -> False
    }

  and {
    check_admin_signed(signers, admin_pub_key_hash),
    trace_if_false(
      is_burn_valid,
      @"must burn only one paramter token at a time",
    ),
  }
}

fn check_admin_signed(
  signers: List<VerificationKeyHash>,
  admin_pub_key_hash: VerificationKeyHash,
) -> Bool {
  let signed = signers |> list.any(fn(signer) { signer == admin_pub_key_hash })
  when signed is {
    True -> True
    _ -> {
      trace @"tx must be signed by admin"
      False
    }
  }
}

fn check_minted_token(
  mint: Value,
  own_policy_id: PolicyId,
  unique_asset_name: AssetName,
) -> Bool {
  let is_valid =
    when
      mint
        |> assets.tokens(own_policy_id)
        |> dict.to_pairs
    is {
      [asset] -> {
        let Pair(asset_name, amount) = asset
        and {
          asset_name == unique_asset_name,
          amount == 1,
        }
      }
      _ -> False
    }
  when is_valid is {
    True -> True
    False -> {
      trace string.concat(
        @"must mint only one paramter token whose name is ",
        diagnostic(unique_asset_name),
      )
      False
    }
  }
}

fn check_paramter_locked(
  outputs: List<Output>,
  own_policy_id: PolicyId,
  unique_asset_name: AssetName,
  parameter_locker_script_hash: ScriptHash,
) -> Bool {
  when find_script_outputs(outputs, parameter_locker_script_hash) is {
    [script_output] -> {
      let Output(_, o_value, ..) = script_output
      assets.quantity_of(o_value, own_policy_id, unique_asset_name) == 1
    }
    _ -> {
      trace @"must have only one paramter locker output"
      False
    }
  }
}
