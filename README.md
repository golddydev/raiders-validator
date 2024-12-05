# Raiders Contracts

Raiders Contracts will allow anyone to create bounties for community members to earn

rewards for taking specific actions.

---

## Validator Descriptions

There are a few validators we will be using:

- raid_mint - This is the minting policy for `RaidNFT`
- raid_lock - This locks `RaidNFT` with their bounty
- parameter_mint - This is the minting policy for `ParameterNFT`
- parameter_lock: This locks `ParameterNFT` with its datum

### Raid Datum

```rust
type RaidDatum {
	quantity: Int,
	/// price is in lovelace
	price: Int,
	creator: VerificationKeyHash, /// Pub Key Hash
}
```

### Parameter

```rust
pub type Parameter {
	raid_locker_script_hash: ScriptHash,
	/// Script Hash of Raid Locker
}
```

## How to use off-chain?

### Parameter Functions

```typescript
import { parameterBurn, parameterMint } from "novalab-raiders";
```

#### Mint Parameter

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select Admin's wallet
// adminAddress: Raider Platform's Admin Address
const txCompleteResult = await parameterMint(lucid, adminAddress);
if (!txCompleteResult.ok) {
  // Tx Failed
  console.error(txCompleteResult.error);
} else {
  // Submit Tx
  const txHash = await(await txCompleteResult.data.sign().complete()).submit();
}
```

#### Burn Parameter

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select Admin's wallet
// adminAddress: Raider Platform's Admin Address
// unit: Asset Id of Parameter NFT to burn
const txCompleteResult = await parameterBurn(lucid, adminAddress, unit);
if (!txCompleteResult.ok) {
  // Tx Failed
  console.error(txCompleteResult.error);
} else {
  // Submit Tx
  const txHash = await(await txCompleteResult.data.sign().complete()).submit();
}
```

---

### Raid Functions

```typescript
import { raidClaim, raidCreate, raidRemove, raidUpdate } from "novalab-raiders";
```

#### Create a Raid

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select Creator's wallet
// quantity: Quantity of Bounty
// price: Bounty Price - e.g. `10_000_000n` for 10 ada
// creator: Creator's Address
// parameterRefUtxoTxHash: Tx Hash of Reference UTxO where Paremeter NFT exists
// parameterRefUtxoTxIndex: Tx Hash of Reference UTxO where Paremeter NFT exists
const txCompleteResult = await raidCreate(
  lucid,
  quantity,
  price,
  creator,
  parameterRefUtxoTxHash,
  parameterRefUtxoTxIndex
);
```

#### Claim from a Raid

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select User's wallet
// adminAddress: Admin's Address
// unit: Asset Id of Raid from which to claim
// userAddress: User's Address to perform claim
// parameterRefUtxoTxHash: Tx Hash of Reference UTxO where Paremeter NFT exists
// parameterRefUtxoTxIndex: Tx Hash of Reference UTxO where Paremeter NFT exists
const txCompleteResult = await raidClaim(
  lucid,
  adminAddress,
  unit,
  userAddress,
  parameterRefUtxoTxHash,
  parameterRefUtxoTxIndex
);

// NOTE: Transaction must be signed by Admin Address also
```

#### Update a Raid

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select User's wallet
// unit: Asset Id of Raid to update
// newQuantity: New Quantity to update to
// userAddress: User's Address to perform update
// parameterRefUtxoTxHash: Tx Hash of Reference UTxO where Paremeter NFT exists
// parameterRefUtxoTxIndex: Tx Hash of Reference UTxO where Paremeter NFT exists
const txCompleteResult = await raidUpdate(
  lucid,
  unit,
  newQuantity,
  userAddress,
  parameterRefUtxoTxHash,
  parameterRefUtxoTxIndex
);
```

#### Remove a Raid

```typescript
// lucid: `LucidEvolution` from `@lucid-evolution/lucid`
// select User's wallet
// unit: Asset Id of Raid from which to claim
// userAddress: User's Address to perform remove
// parameterRefUtxoTxHash: Tx Hash of Reference UTxO where Paremeter NFT exists
// parameterRefUtxoTxIndex: Tx Hash of Reference UTxO where Paremeter NFT exists
const txCompleteResult = await raidRemove(
  lucid,
  unit,
  userAddress,
  parameterRefUtxoTxHash,
  parameterRefUtxoTxIndex
);

// NOTE: Transaction must be signed by Raid's Creator also
```
