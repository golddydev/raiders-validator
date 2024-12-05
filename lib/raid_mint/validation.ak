use aiken/cbor.{diagnostic}
use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use aiken/primitive/string
use cardano/address.{Address}
use cardano/assets.{AssetName, PolicyId, Value}
use cardano/transaction.{Output, Transaction, find_script_outputs}
use common/utils.{
  get_first_output_reference, get_unique_token_name, trace_if_false,
} as c_utils
use parameter/types.{Parameter} as p_types
use parameter/utils.{extract_parameter} as p_utils
use raid/types.{RaidDatum}
use raid/utils.{calc_bounty, calc_bounty_fee, extract_raid_datum_from_datum}
use validation/payout

pub fn can_create(
  tx: Transaction,
  own_policy_id: PolicyId,
  parameter_nft_policy_id: PolicyId,
  quantity: Int,
  price: Int,
) -> Bool {
  let Transaction {
    inputs,
    reference_inputs,
    outputs,
    mint,
    extra_signatories: signers,
    ..
  } = tx
  let first_output_ref = get_first_output_reference(inputs)
  let unique_asset_name = get_unique_token_name(first_output_ref)

  let check_quantity = quantity >= 0
  let check_price = price > 0

  let Parameter(
    raid_locker_script_hash,
    project_address,
    fee_percentage,
    authorizers_pub_key_hashes,
  ) = extract_parameter(reference_inputs, parameter_nft_policy_id)

  and {
    trace_if_false(check_quantity, @"quantity must greater than or equal to 0"),
    trace_if_false(check_price, @"price must greater than 0"),
    check_minted_token(mint, own_policy_id, unique_asset_name),
    check_minting_fee(
      outputs,
      signers,
      project_address,
      fee_percentage,
      authorizers_pub_key_hashes,
      quantity,
      price,
    ),
    check_raid_locked(
      outputs,
      signers,
      own_policy_id,
      unique_asset_name,
      raid_locker_script_hash,
      quantity,
      price,
    ),
  }
}

pub fn can_burn(tx: Transaction, own_policy_id: PolicyId) -> Bool {
  let Transaction { mint, .. } = tx
  let is_valid =
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
  when is_valid is {
    True -> True
    False -> {
      trace @"must burn only one raid token at a time"
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
        @"must mint only one raid token whose name is ",
        diagnostic(unique_asset_name),
      )
      False
    }
  }
}

fn check_minting_fee(
  outputs: List<Output>,
  signers: List<VerificationKeyHash>,
  project_address: Address,
  fee_percentage: Int,
  authorizers_pub_key_hashes: List<VerificationKeyHash>,
  quantity: Int,
  price: Int,
) -> Bool {
  let authorizer_signed =
    authorizers_pub_key_hashes
      |> list.any(fn(authorizer) { list.has(signers, authorizer) })

  when authorizer_signed is {
    True -> True
    False -> {
      let fee = calc_bounty_fee(fee_percentage, quantity, price)
      when
        payout.at_least(project_address, assets.from_lovelace(fee), outputs)
      is {
        True -> True
        False -> {
          trace @"must pay correct fee to project address"
          trace string.concat(@"fee is ", diagnostic(fee))
          trace string.concat(
            @"project address is ",
            diagnostic(project_address),
          )
          False
        }
      }
    }
  }
}

fn check_raid_locked(
  outputs: List<Output>,
  signers: List<VerificationKeyHash>,
  own_policy_id: PolicyId,
  unique_asset_name: AssetName,
  raid_locker_script_hash: ScriptHash,
  quantity: Int,
  price: Int,
) -> Bool {
  when find_script_outputs(outputs, raid_locker_script_hash) is {
    [script_output] -> {
      let Output(_, o_value, o_datum, _) = script_output
      let RaidDatum(datum_quantity, datum_price, creator) =
        extract_raid_datum_from_datum(o_datum)

      let check_creator_signed =
        list.any(signers, fn(signer) { signer == creator })
      let check_datum = and {
          datum_quantity == quantity,
          datum_price == price,
        }
      and {
        trace_if_false(
          check_creator_signed,
          string.concat(@"must signed by creator ", diagnostic(creator)),
        ),
        trace_if_false(check_datum, @"must have correct datum"),
        check_locked_value(
          o_value,
          own_policy_id,
          unique_asset_name,
          quantity,
          price,
        ),
      }
    }
    _ -> {
      trace @"must have only one raid locker output"
      False
    }
  }
}

fn check_locked_value(
  output_value: Value,
  own_policy_id: PolicyId,
  unique_asset_name: AssetName,
  quantity: Int,
  price: Int,
) -> Bool {
  let check_minted_raid_locked =
    when output_value |> assets.tokens(own_policy_id) |> dict.to_pairs is {
      [asset] -> {
        let Pair(asset_name, amount) = asset
        and {
          asset_name == unique_asset_name,
          amount == 1,
        }
      }
      _ -> False
    }
  let bounty_expected = calc_bounty(quantity, price)
  let bounty_locked = assets.lovelace_of(output_value) >= bounty_expected
  and {
    trace_if_false(
      check_minted_raid_locked,
      @"must lock minted raid token to locker",
    ),
    trace_if_false(
      bounty_locked,
      string.concat(@"must lock bounty of ", diagnostic(bounty_expected)),
    ),
  }
}
