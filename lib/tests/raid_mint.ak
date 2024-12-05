use cardano/assets
use cardano/transaction.{Input, Output}
use common/utils.{get_unique_token_name} as c_utils
use mocks/fake_constants.{
  authorizer_pub_key_hash1, authorizers_pub_key_hashes, fee_percentage,
  parameter_token_policy_id, project_address, raid_locker_script_hash,
  raid_nft_policy_id,
}
use mocks/mocks.{
  build_raid_datum, creator_pub_key_hash, make_parameter_reference_input,
  make_transaction, project_output, raid_nft_input, raid_nft_output,
}
use raid/utils.{calc_bounty, calc_bounty_fee}
use raid_mint/validation.{can_burn, can_create}
use tests/fake_tx.{test_input}

/// can create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// correct bounty locked
/// pay fee to project address
test can_create_0() {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let bounty_fee = calc_bounty_fee(fee_percentage, quantity, price)

  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
      project_output(project_address(), bounty_fee),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// correct bounty locked
/// sign with authorizer & not pay fee to project address
test can_create_1() {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        authorizers_pub_key_hashes(),
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)

  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash(), authorizer_pub_key_hash1]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// NOT quantity must be greater than or equal to 0
/// NOT price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// correct bounty locked
test can_create_2() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 0
  let bounty_locked = calc_bounty(quantity, price)
  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// NOT only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// correct bounty locked
test can_create_3() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let wrong_raid_nft_asset_name = "wrong_raid_nft_asset_name"
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        wrong_raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero
      |> assets.add(raid_nft_policy_id, wrong_raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// NOT sign with creator
/// send raid to raid_locker
/// correct bounty locked
test can_create_4() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = []

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// NOT send raid to raid_locker
/// correct bounty locked
test can_create_5() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let outputs: List<Output> =
    [
      raid_nft_output(
        #"1234",
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// NOT correct bounty locked
test can_create_6() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = 10_000_000
  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can NOT create Raid NFT
/// quantity must be greater than or equal to 0
/// price must be greater than 0
/// only 1 unique asset name
/// sign with creator
/// send raid to raid_locker
/// correct bounty locked
/// NOT pay fee to project address
test can_create_7() fail {
  let first_input = test_input()
  let inputs: List<Input> = [first_input]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let raid_nft_asset_name = get_unique_token_name(first_input.output_reference)
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)

  let outputs: List<Output> =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, 1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_create(tx, raid_nft_policy_id, parameter_token_policy_id, quantity, price)
}

/// can burn Raid NFT
/// burn only one at a time
test can_burn_0() {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"
  let inputs: List<Input> =
    [
      raid_nft_input(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        bounty_locked,
        build_raid_datum(quantity, price, creator_pub_key_hash()),
      ),
    ]

  let reference_inputs =
    [
      make_parameter_reference_input(
        raid_locker_script_hash,
        project_address(),
        fee_percentage,
        [],
      ),
    ]

  let outputs: List<Output> = []

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, -1)
  let signers = [creator_pub_key_hash()]

  let tx =
    make_transaction(inputs, reference_inputs, outputs, mint_value, signers)

  can_burn(tx, raid_nft_policy_id)
}
