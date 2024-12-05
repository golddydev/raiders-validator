use aiken/crypto.{VerificationKeyHash}

pub type RaidDatum {
  quantity: Int,
  /// price is in lovelace
  price: Int,
  creator: VerificationKeyHash,
}
