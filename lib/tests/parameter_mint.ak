use cardano/assets
use cardano/transaction.{Input, Output}
use common/utils.{get_unique_token_name}
use mocks/fake_constants.{
  admin_pub_key_hash, fee_percentage, parameter_locker_script_hash,
  parameter_token_policy_id, project_address, raid_locker_script_hash,
}
use mocks/mocks.{make_transaction,
  parameter_token_input, parameter_token_output}
use parameter_mint/validation.{can_burn, can_mint}
use tests/fake_tx.{test_input}

/// can mint parameter nft
/// sign with admin
/// send nft to parameter locker
/// unique asset name
test can_mint_0() {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let parameter_token_asset_name =
    get_unique_token_name(first_input.output_reference)
  let outputs: List<Output> =
    [
      parameter_token_output(
        parameter_locker_script_hash,
        parameter_token_policy_id,
        parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, 1)
  let signers = [admin_pub_key_hash]

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)
  can_mint(
    tx,
    parameter_token_policy_id,
    admin_pub_key_hash,
    parameter_locker_script_hash,
  )
}

/// can NOT mint parameter nft
/// NOT sign with admin
/// send nft to parameter locker
/// unique asset name
test can_mint_1() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let parameter_token_asset_name =
    get_unique_token_name(first_input.output_reference)
  let outputs: List<Output> =
    [
      parameter_token_output(
        parameter_locker_script_hash,
        parameter_token_policy_id,
        parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, 1)
  let signers = []

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_mint(
    tx,
    parameter_token_policy_id,
    admin_pub_key_hash,
    parameter_locker_script_hash,
  )
}

/// can NOT mint parameter nft
/// sign with admin
/// NOT send nft to parameter locker
/// unique asset name
test can_mint_2() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let parameter_token_asset_name =
    get_unique_token_name(first_input.output_reference)
  let outputs: List<Output> =
    [
      parameter_token_output(
        #"9999",
        parameter_token_policy_id,
        parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, 1)
  let signers = [admin_pub_key_hash]

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_mint(
    tx,
    parameter_token_policy_id,
    admin_pub_key_hash,
    parameter_locker_script_hash,
  )
}

/// can NOT mint parameter nft
/// sign with admin
/// send nft to parameter locker
/// NOT unique asset name
test can_mint_3() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let wrong_parameter_token_asset_name = #"9999"
  let outputs: List<Output> =
    [
      parameter_token_output(
        parameter_locker_script_hash,
        parameter_token_policy_id,
        wrong_parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, wrong_parameter_token_asset_name, 1)
  let signers = [admin_pub_key_hash]

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_mint(
    tx,
    parameter_token_policy_id,
    admin_pub_key_hash,
    parameter_locker_script_hash,
  )
}

/// can burn parameter nft
/// sign with admin
test can_burn_0() {
  let parameter_token_asset_name = "unique_asset_name"

  let inputs: List<Input> =
    [
      parameter_token_input(
        parameter_locker_script_hash,
        parameter_token_policy_id,
        parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let outputs: List<Output> = []

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, -1)
  let signers = [admin_pub_key_hash]

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_burn(tx, parameter_token_policy_id, admin_pub_key_hash)
}

/// can NOT burn parameter nft
/// NOT sign with admin
test can_burn_1() fail {
  let parameter_token_asset_name = "unique_asset_name"

  let inputs: List<Input> =
    [
      parameter_token_input(
        parameter_locker_script_hash,
        parameter_token_policy_id,
        parameter_token_asset_name,
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let outputs: List<Output> = []

  let mint_value =
    assets.zero
      |> assets.add(parameter_token_policy_id, parameter_token_asset_name, -1)
  let signers = []

  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_burn(tx, parameter_token_policy_id, admin_pub_key_hash)
}
