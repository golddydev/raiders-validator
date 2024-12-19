import {
  Assets,
  LucidEvolution,
  paymentCredentialOf,
  TxSignBuilder,
} from "@lucid-evolution/lucid";
import { getPaymentKey, mayFail, mayFailAsync } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

import { getConfig } from "./config/index.js";
import { makeParameterDatum } from "./datum.js";
import { ParameterBurn, ParameterMint } from "./redeemer.js";
import { generateUniqueAssetName } from "./utils/index.js";

const mint = async (
  lucid: LucidEvolution,
  adminAddress: string,
  projectAddress: string,
  authorizersAddresses: string[],
  feePercentage: number
): Promise<Result<TxSignBuilder, string>> => {
  const adminPubKeyHash = getPaymentKey(adminAddress);
  if (!adminPubKeyHash.ok) return Err(adminPubKeyHash.error);

  const authorizersPubKeyHashes = mayFail(() =>
    authorizersAddresses.map(
      (authorizer) => paymentCredentialOf(authorizer).hash
    )
  );
  if (!authorizersPubKeyHashes.ok) return Err(authorizersPubKeyHashes.error);

  const configResult = await getConfig(lucid, adminPubKeyHash.data);
  if (!configResult.ok)
    return Err(`Error loading config: ${configResult.error}`);

  const utxos = await lucid.utxosAt(adminAddress);
  lucid.selectWallet.fromAddress(adminAddress, utxos);
  const qualifiedUtxo = utxos.find(
    (utxo) =>
      "lovelace" in utxo.assets &&
      utxo.assets.lovelace >= 5_000_000n &&
      !utxo.scriptRef
  );
  if (!qualifiedUtxo) return Err("Insufficient Input");

  const { parameterMint, parameterLock, raidLock } = configResult.data;

  const uniqueAssetName = generateUniqueAssetName(qualifiedUtxo);
  const mintingAssets: Assets = {
    [`${parameterMint.policyId}${uniqueAssetName}`]: 1n,
  };

  const datum = makeParameterDatum(
    raidLock.scriptHash,
    projectAddress,
    feePercentage,
    authorizersPubKeyHashes.data
  );
  if (!datum.ok) return Err(`Error making datum: ${datum.error}`);

  lucid.selectWallet.fromAddress(adminAddress, [qualifiedUtxo]);
  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .mintAssets(mintingAssets, ParameterMint())
      .attach.MintingPolicy(parameterMint.validator)
      .addSignerKey(adminPubKeyHash.data)
      .pay.ToAddressWithData(parameterLock.address, datum.data, mintingAssets)
      .attachMetadata(674, {
        msg: ["Mint Parameter"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);
  return Ok(txComplete.data);
};

const burn = async (
  lucid: LucidEvolution,
  adminAddress: string,
  unit: string
): Promise<Result<TxSignBuilder, string>> => {
  const adminPubKeyHash = getPaymentKey(adminAddress);
  if (!adminPubKeyHash.ok) return Err(adminPubKeyHash.error);

  const utxoResult = await mayFailAsync(() =>
    lucid.utxoByUnit(unit)
  ).complete();
  if (!utxoResult.ok) return Err(utxoResult.error);

  const configResult = await getConfig(lucid, adminPubKeyHash.data);
  if (!configResult.ok)
    return Err(`Error loading config: ${configResult.error}`);

  lucid.selectWallet.fromAddress(
    adminAddress,
    await lucid.utxosAt(adminAddress)
  );

  const { parameterMint, parameterLock } = configResult.data;

  const burnAssets: Assets = {
    [unit]: -1n,
  };
  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .collectFrom([utxoResult.data])
      .attach.SpendingValidator(parameterLock.validator)
      .mintAssets(burnAssets, ParameterBurn())
      .attach.MintingPolicy(parameterMint.validator)
      .addSigner(adminAddress)
      .attachMetadata(674, {
        msg: ["Burn Parameter"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);

  return Ok(txComplete.data);
};

export { burn, mint };
