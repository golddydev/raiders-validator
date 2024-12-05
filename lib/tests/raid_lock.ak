use cardano/assets
use cardano/transaction.{InlineDatum}
use mocks/fake_constants.{
  admin_pub_key_hash, raid_locker_script_hash, raid_nft_policy_id,
}
use mocks/mocks.{
  build_raid_datum, creator_pub_key_hash, make_transaction, raid_nft_input,
  raid_nft_output, user_claimed_output,
}
use raid/types.{RaidDatum}
use raid/utils.{calc_bounty}
use raid_lock/validation.{can_claim, can_close}

/// can claim
/// prevent double satisfaction
/// quantity > 0
/// sign with admin
test can_claim_0() {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input]

  let new_quantity = quantity - 1
  let new_bounty_locked = calc_bounty(new_quantity, price)
  let outputs =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        new_bounty_locked,
        build_raid_datum(new_quantity, price, creator_pub_key_hash()),
      ),
      user_claimed_output(price),
    ]

  let signers = [admin_pub_key_hash]
  let tx = make_transaction(inputs, [], outputs, assets.zero, signers)

  can_claim(
    tx,
    raid_locker_script_hash,
    admin_pub_key_hash,
    raid_nft_policy_id,
    old_raid_datum,
  )
}

/// can NOT claim
/// NOT prevent double satisfaction
/// quantity > 0
/// sign with admin
test can_claim_1() fail {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"
  let other_raid_nft_asset_name = "other_unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let other_spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      other_raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input, other_spending_input]

  let new_quantity = quantity - 1
  let new_bounty_locked = calc_bounty(new_quantity, price)
  let outputs =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        new_bounty_locked,
        build_raid_datum(new_quantity, price, creator_pub_key_hash()),
      ),
      user_claimed_output(price),
    ]

  let signers = [admin_pub_key_hash]
  let tx = make_transaction(inputs, [], outputs, assets.zero, signers)

  can_claim(
    tx,
    raid_locker_script_hash,
    admin_pub_key_hash,
    raid_nft_policy_id,
    old_raid_datum,
  )
}

/// can NOT claim
/// prevent double satisfaction
/// NOT quantity > 0
/// sign with admin
test can_claim_2() fail {
  let quantity = 0
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input]

  let new_quantity = quantity - 1
  let new_bounty_locked = calc_bounty(new_quantity, price)
  let outputs =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        new_bounty_locked,
        build_raid_datum(new_quantity, price, creator_pub_key_hash()),
      ),
      user_claimed_output(price),
    ]

  let signers = [admin_pub_key_hash]
  let tx = make_transaction(inputs, [], outputs, assets.zero, signers)

  can_claim(
    tx,
    raid_locker_script_hash,
    admin_pub_key_hash,
    raid_nft_policy_id,
    old_raid_datum,
  )
}

/// can NOT claim
/// prevent double satisfaction
/// quantity > 0
/// NOT sign with admin
test can_claim_3() fail {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input]

  let new_quantity = quantity - 1
  let new_bounty_locked = calc_bounty(new_quantity, price)
  let outputs =
    [
      raid_nft_output(
        raid_locker_script_hash,
        raid_nft_policy_id,
        raid_nft_asset_name,
        new_bounty_locked,
        build_raid_datum(new_quantity, price, creator_pub_key_hash()),
      ),
      user_claimed_output(price),
    ]

  let signers = []
  let tx = make_transaction(inputs, [], outputs, assets.zero, signers)

  can_claim(
    tx,
    raid_locker_script_hash,
    admin_pub_key_hash,
    raid_nft_policy_id,
    old_raid_datum,
  )
}

/// can Close raid
/// preview double satisfaction
/// burn Raid NFT
/// sign with creator
test can_close_0() {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input]

  let outputs = []

  let mint_value =
    assets.zero |> assets.add(raid_nft_policy_id, raid_nft_asset_name, -1)

  let signers = [creator_pub_key_hash()]
  let tx = make_transaction(inputs, [], outputs, mint_value, signers)

  can_close(tx, raid_locker_script_hash, raid_nft_policy_id, old_raid_datum)
}

/// can NOT Close raid
/// preview double satisfaction
/// NOT burn Raid NFT
/// sign with creator
test can_close_1() fail {
  let quantity = 10
  let price = 10_000_000
  let bounty_locked = calc_bounty(quantity, price)
  let raid_nft_asset_name = "unique_raid_asset_name"

  let old_datum = build_raid_datum(quantity, price, creator_pub_key_hash())
  expect InlineDatum(old_datum_inline_data) = old_datum
  expect old_raid_datum: RaidDatum = old_datum_inline_data

  let spending_input =
    raid_nft_input(
      raid_locker_script_hash,
      raid_nft_policy_id,
      raid_nft_asset_name,
      bounty_locked,
      old_datum,
    )
  let inputs = [spending_input]

  let outputs = []

  let signers = [creator_pub_key_hash()]
  let tx = make_transaction(inputs, [], outputs, assets.zero, signers)

  can_close(tx, raid_locker_script_hash, raid_nft_policy_id, old_raid_datum)
}
