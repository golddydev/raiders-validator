use aiken/cbor.{diagnostic}
use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/primitive/string
use cardano/address.{Script}
use cardano/assets.{AssetName, PolicyId, Value}
use cardano/transaction.{Input, Output, Transaction, find_script_outputs}
use common/utils.{
  get_script_inputs, inputs_by_payment_credential, trace_if_false,
} as c_utils
use raid/types.{RaidDatum}
use raid/utils.{calc_bounty, extract_raid_datum_from_datum}

pub fn can_claim(
  tx: Transaction,
  script_hash: ScriptHash,
  admin_pub_key_hash: VerificationKeyHash,
  raid_nft_policy_id: PolicyId,
  datum: RaidDatum,
) -> Bool {
  let Transaction { inputs, outputs, extra_signatories: signers, .. } = tx
  let check_script_inputs =
    inputs_by_payment_credential(inputs, Script(script_hash)) == 1

  let RaidDatum(quantity, price, creator) = datum
  let check_raid_quantity = quantity > 0

  let script_output =
    when find_script_outputs(outputs, script_hash) is {
      [output] -> output
      _ -> fail @"must have one script output"
    }
  let check_admin_signed =
    signers |> list.any(fn(signer) { signer == admin_pub_key_hash })

  and {
    trace_if_false(check_script_inputs, @"must have only one script input"),
    trace_if_false(check_raid_quantity, @"raid quantity must be greater than 0"),
    trace_if_false(check_admin_signed, @"tx must be signed by admin"),
    check_script_output(
      script_output,
      raid_nft_policy_id,
      quantity - 1,
      price,
      creator,
    ),
  }
}

pub fn can_close(
  tx: Transaction,
  script_hash: ScriptHash,
  raid_nft_policy_id: PolicyId,
  datum: RaidDatum,
) -> Bool {
  let Transaction { inputs, extra_signatories: signers, mint, .. } = tx
  let script_inputs = get_script_inputs(inputs, script_hash)
  let script_input =
    when script_inputs is {
      [input] -> input
      _ -> fail @"must have only one script input"
    }
  let Input(_, output) = script_input
  let raid_asset_name = get_locked_raid_asset_name(output, raid_nft_policy_id)

  let check_burnt =
    is_raid_asset_burnt(mint, raid_nft_policy_id, raid_asset_name)

  let RaidDatum(_, _, creator) = datum

  let check_creator_signed =
    signers |> list.any(fn(signer) { signer == creator })

  and {
    trace_if_false(check_burnt, @"must burn raid nft to close"),
    trace_if_false(check_creator_signed, @"tx must be signed by creator"),
  }
}

fn check_script_output(
  output: Output,
  raid_nft_policy_id: PolicyId,
  quantity: Int,
  price: Int,
  creator: VerificationKeyHash,
) -> Bool {
  let Output(_, o_value, o_datum, _) = output
  let o_raid_datum = extract_raid_datum_from_datum(o_datum)
  let check_datum = o_raid_datum == RaidDatum(quantity, price, creator)
  let bounty_expected = calc_bounty(quantity, price)
  let raid_locked =
    when assets.tokens(o_value, raid_nft_policy_id) |> dict.to_pairs is {
      [_] -> True
      _ -> False
    }
  let bounty_locked = assets.lovelace_of(o_value) >= bounty_expected
  and {
    trace_if_false(check_datum, @"raid datum must be correct"),
    trace_if_false(raid_locked, @"must have only one raid token in output"),
    trace_if_false(
      bounty_locked,
      string.concat(@"must lock bounty of ", diagnostic(bounty_expected)),
    ),
  }
}

fn get_locked_raid_asset_name(
  output: Output,
  raid_nft_policy_id: PolicyId,
) -> AssetName {
  let Output(_, v, ..) = output
  when v |> assets.tokens(raid_nft_policy_id) |> dict.to_pairs is {
    [asset] -> {
      let Pair(asset_name, _) = asset
      asset_name
    }
    _ -> fail @"only one raid nft must be locked into each utxo"
  }
}

fn is_raid_asset_burnt(
  mint: Value,
  raid_nft_policy_id: PolicyId,
  raid_asset_name: AssetName,
) -> Bool {
  when
    mint
      |> assets.tokens(raid_nft_policy_id)
      |> dict.to_pairs
  is {
    [asset] -> {
      let Pair(asset_name, amount) = asset
      and {
        raid_asset_name == asset_name,
        amount == -1,
      }
    }
    _ -> False
  }
}
