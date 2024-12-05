use cardano/transaction.{Datum, InlineDatum}
use raid/types.{RaidDatum}

pub fn extract_raid_datum_from_datum(datum: Datum) -> RaidDatum {
  when datum is {
    InlineDatum(inline_data) -> {
      expect raid_datum: RaidDatum = inline_data
      raid_datum
    }
    _ -> fail @"raid datum must be inline"
  }
}

pub fn calc_bounty(quantity: Int, price: Int) -> Int {
  quantity * price + 2_000_000
}

pub fn calc_bounty_fee(fee_percentage: Int, quantity: Int, price: Int) -> Int {
  let bounty = quantity * price
  if fee_percentage >= 100 {
    bounty
  } else {
    bounty / 100 * fee_percentage
  }
}
