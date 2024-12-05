import {
  Assets,
  credentialToAddress,
  keyHashToCredential,
  LucidEvolution,
  TxSignBuilder,
  UTxO,
  validatorToAddress,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";
import {
  getBlockfrostApi,
  getLucid,
  getPaymentKey,
  mayFailAsync,
} from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

import { getDeployedConfig } from "./config/index.js";
import {
  decodeParameterDatum,
  decodeRaidDatum,
  makeRaidDatum,
} from "./datum.js";
import { RaidClaim, RaidClose, RaidCreate, RaidRemove } from "./redeemer.js";
import {
  calcBountyFee,
  calcRequiredBounty,
  convertSchemaTypeToAddress,
  generateUniqueAssetName,
} from "./utils/index.js";

const create = async (
  lucid: LucidEvolution,
  quantity: number,
  price: bigint,
  creator: string,
  parameterRefUtxo: UTxO,
  isTesting: boolean = false
): Promise<
  Result<
    {
      tx: TxSignBuilder;
      assetId: string;
    },
    string
  >
> => {
  if (quantity < 0) return Err("quantity must be greater than or equal to 0");
  if (price <= 0n) return Err("price must be greater than 0");
  const lucidNetwork = lucid.config().network;
  if (!lucidNetwork) return Err("Lucid Network is not set");

  const creatorPubKeyHash = getPaymentKey(creator);
  if (!creatorPubKeyHash.ok)
    return Err(`Creator Address error: ${creatorPubKeyHash.error}`);

  const deployedConfigResult = await getDeployedConfig(lucid, isTesting);
  if (!deployedConfigResult.ok)
    return Err(`Deployed Config error: ${deployedConfigResult.error}`);

  const { raidLock, raidMint } = deployedConfigResult.data;
  if (!raidLock.scriptRef || !raidMint.scriptRef)
    return Err(`Deploy Raid Contracts: Script Not Found`);

  const raidPolicyId = validatorToScriptHash(raidMint.scriptRef);
  const raidLockAddress = validatorToAddress(lucidNetwork, raidLock.scriptRef);

  /// decode parameter
  if (!parameterRefUtxo.datum)
    return Err("Parameter Ref UTxO does not have inline datum");
  const decodedParameter = decodeParameterDatum(parameterRefUtxo.datum);
  if (!decodedParameter.ok)
    return Err(`Decoding Parameter Datum error: ${decodedParameter.error}`);
  const { projectAddress: projectAddressSchema, feePercentage } =
    decodedParameter.data;
  const projectAddress = convertSchemaTypeToAddress(
    lucidNetwork,
    projectAddressSchema
  );
  if (!projectAddress.ok)
    return Err(`Project Address error: ${projectAddress.error}`);

  const requiredBounty = calcRequiredBounty(quantity, price);
  const bountyFee = calcBountyFee(feePercentage, quantity, price);

  const qualifiedAmount = requiredBounty + bountyFee + 5_000_000n;
  const utxos = await lucid.wallet().getUtxos();
  /// sort utxos lovelace amount descending order
  utxos.sort((a, b) => (a.assets.lovelace < b.assets.lovelace ? 1 : -1));
  const [selectedAmount, selectedUtxos] = utxos.reduce(
    (acc, cur) => {
      const [sAmount, sUtxos] = acc;
      if (sAmount >= qualifiedAmount) return acc;
      const currentBalance =
        "lovelace" in cur.assets ? cur.assets.lovelace : 0n;
      sUtxos.push(cur);
      return [sAmount + currentBalance, sUtxos];
    },
    [0n, [] as UTxO[]]
  );

  if (selectedUtxos.length == 0 || selectedAmount < qualifiedAmount)
    return Err("Insufficient Balance");

  /// sort utxos lexicographically
  selectedUtxos.sort((a, b) => (a.txHash > b.txHash ? 1 : -1));
  const uniqueAssetName = generateUniqueAssetName(selectedUtxos[0]);
  const mintingAssets: Assets = {
    [`${raidPolicyId}${uniqueAssetName}`]: 1n,
  };

  const datum = makeRaidDatum(quantity, price, creatorPubKeyHash.data);
  if (!datum.ok) return Err(`Making Datum error: ${datum.error}`);

  lucid.wallet().overrideUTxOs(selectedUtxos);

  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .readFrom([parameterRefUtxo, raidMint])
      .mintAssets(mintingAssets, RaidCreate(quantity, price))
      .addSigner(creator)
      .pay.ToAddressWithData(raidLockAddress, datum.data, {
        ...mintingAssets,
        lovelace: requiredBounty,
      })
      .pay.ToAddress(projectAddress.data, { lovelace: bountyFee })
      .attachMetadata(674, {
        msg: ["Create Raid"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);
  return Ok({
    tx: txComplete.data,
    assetId: `${raidPolicyId}${uniqueAssetName}`,
  });
};

const createWithAuthorizer = async (
  lucid: LucidEvolution,
  quantity: number,
  price: bigint,
  creator: string,
  authorizer: string,
  parameterRefUtxo: UTxO,
  isTesting: boolean = false
): Promise<
  Result<
    {
      tx: TxSignBuilder;
      assetId: string;
    },
    string
  >
> => {
  if (quantity < 0) return Err("quantity must be greater than or equal to 0");
  if (price <= 0n) return Err("price must be greater than 0");
  const lucidNetwork = lucid.config().network;
  if (!lucidNetwork) return Err("Lucid Network is not set");

  const creatorPubKeyHash = getPaymentKey(creator);
  if (!creatorPubKeyHash.ok)
    return Err(`Creator Address error: ${creatorPubKeyHash.error}`);

  const deployedConfigResult = await getDeployedConfig(lucid, isTesting);
  if (!deployedConfigResult.ok)
    return Err(`Deployed Config error: ${deployedConfigResult.error}`);

  const { raidLock, raidMint } = deployedConfigResult.data;
  if (!raidLock.scriptRef || !raidMint.scriptRef)
    return Err(`Deploy Raid Contracts: Script Not Found`);

  const raidPolicyId = validatorToScriptHash(raidMint.scriptRef);
  const raidLockAddress = validatorToAddress(lucidNetwork, raidLock.scriptRef);

  /// decode parameter
  if (!parameterRefUtxo.datum)
    return Err("Parameter Ref UTxO does not have inline datum");
  const decodedParameter = decodeParameterDatum(parameterRefUtxo.datum);
  if (!decodedParameter.ok)
    return Err(`Decoding Parameter Datum error: ${decodedParameter.error}`);
  const { authorizersPubKeyHashes } = decodedParameter.data;

  /// check if authroizer is valid
  const authroizerPaymentKey = getPaymentKey(authorizer);
  if (!authroizerPaymentKey.ok)
    return Err(`Authorizer is not valid payment address`);
  const isValidAuthorizer = authorizersPubKeyHashes.some(
    (keyHash) =>
      keyHash.toLowerCase() == authroizerPaymentKey.data.toLowerCase()
  );
  if (!isValidAuthorizer) return Err(`Authorizer is not in Parameter`);

  const requiredBounty = calcRequiredBounty(quantity, price);

  const qualifiedAmount = requiredBounty + 5_000_000n;
  const utxos = await lucid.wallet().getUtxos();
  /// sort utxos lovelace amount descending order
  utxos.sort((a, b) => (a.assets.lovelace < b.assets.lovelace ? 1 : -1));
  const [selectedAmount, selectedUtxos] = utxos.reduce(
    (acc, cur) => {
      const [sAmount, sUtxos] = acc;
      if (sAmount >= qualifiedAmount) return acc;
      const currentBalance =
        "lovelace" in cur.assets ? cur.assets.lovelace : 0n;
      sUtxos.push(cur);
      return [sAmount + currentBalance, sUtxos];
    },
    [0n, [] as UTxO[]]
  );

  if (selectedUtxos.length == 0 || selectedAmount < qualifiedAmount)
    return Err("Insufficient Balance");

  /// sort utxos lexicographically
  selectedUtxos.sort((a, b) => (a.txHash > b.txHash ? 1 : -1));
  const uniqueAssetName = generateUniqueAssetName(selectedUtxos[0]);
  const mintingAssets: Assets = {
    [`${raidPolicyId}${uniqueAssetName}`]: 1n,
  };

  const datum = makeRaidDatum(quantity, price, creatorPubKeyHash.data);
  if (!datum.ok) return Err(`Making Datum error: ${datum.error}`);

  lucid.wallet().overrideUTxOs(selectedUtxos);

  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .readFrom([parameterRefUtxo, raidMint])
      .mintAssets(mintingAssets, RaidCreate(quantity, price))
      .addSigner(creator)
      .addSigner(authorizer)
      .pay.ToAddressWithData(raidLockAddress, datum.data, {
        ...mintingAssets,
        lovelace: requiredBounty,
      })
      .attachMetadata(674, {
        msg: ["Create Raid"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);
  return Ok({
    tx: txComplete.data,
    assetId: `${raidPolicyId}${uniqueAssetName}`,
  });
};

const claim = async (
  lucid: LucidEvolution,
  adminAddress: string,
  unit: string,
  isTesting: boolean = false
): Promise<Result<TxSignBuilder, string>> => {
  const adminPubKeyHash = getPaymentKey(adminAddress);
  if (!adminPubKeyHash.ok) return Err(adminPubKeyHash.error);

  const deployedConfigResult = await getDeployedConfig(lucid, isTesting);
  if (!deployedConfigResult.ok)
    return Err(`Deployed Config error: ${deployedConfigResult.error}`);

  const { raidLock, raidMint } = deployedConfigResult.data;
  if (!raidLock.scriptRef || !raidMint.scriptRef)
    return Err(`Deploy Raid Contracts: Script Not Found`);

  const utxoResult = await mayFailAsync(() =>
    lucid.utxoByUnit(unit)
  ).complete();
  if (!utxoResult.ok) return Err(utxoResult.error);

  const { datum, address: lockedAddress, assets } = utxoResult.data;
  if (!datum) return Err(`UTxO doesn't have datum - invalid`);

  // check correctly locked in raid locker
  const lockedAddressPubKeyHash = getPaymentKey(lockedAddress);
  if (!lockedAddressPubKeyHash.ok) return Err("Locked UTxO is invalid");
  if (lockedAddressPubKeyHash.data != validatorToScriptHash(raidLock.scriptRef))
    return Err(`Locked Address is not same as deployed`);

  const decodedResult = decodeRaidDatum(datum);
  if (!decodedResult.ok)
    return Err(`Decoding Datum error: ${decodedResult.error}`);

  const { creator: creatorPubKeyHash, price, quantity } = decodedResult.data;
  if (quantity <= 0) return Err(`quantity must be greater than 0 to claim`);

  /// make asset data and datum
  const requiredBounty = calcRequiredBounty(quantity - 1, price);
  const newDatum = makeRaidDatum(quantity - 1, price, creatorPubKeyHash);
  if (!newDatum.ok) return Err(`Making Datum error: ${newDatum.error}`);

  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .readFrom([raidLock])
      .collectFrom([utxoResult.data], RaidClaim())
      .addSigner(adminAddress)
      .pay.ToAddressWithData(lockedAddress, newDatum.data, {
        ...assets,
        lovelace: requiredBounty,
      })
      .attachMetadata(674, {
        msg: ["Claim Raid"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);
  return Ok(txComplete.data);
};

const remove = async (
  lucid: LucidEvolution,
  unit: string,
  isTesting: boolean = false
): Promise<Result<TxSignBuilder, string>> => {
  const lucidNetwork = lucid.config().network;
  if (!lucidNetwork) return Err("Lucid Network is not set");

  const deployedConfigResult = await getDeployedConfig(lucid, isTesting);
  if (!deployedConfigResult.ok)
    return Err(`Deployed Config error: ${deployedConfigResult.error}`);

  const { raidLock, raidMint } = deployedConfigResult.data;
  if (!raidLock.scriptRef || !raidMint.scriptRef)
    return Err(`Deploy Raid Contracts: Script Not Found`);

  const utxoResult = await mayFailAsync(() =>
    lucid.utxoByUnit(unit)
  ).complete();
  if (!utxoResult.ok) return Err(utxoResult.error);

  const { datum, address: lockedAddress } = utxoResult.data;
  if (!datum) return Err(`UTxO doesn't have datum - invalid`);

  // check correctly locked in raid locker
  const lockedAddressPubKeyHash = getPaymentKey(lockedAddress);
  if (!lockedAddressPubKeyHash.ok) return Err("Locked UTxO is invalid");
  if (lockedAddressPubKeyHash.data != validatorToScriptHash(raidLock.scriptRef))
    return Err(`Locked Address is not same as deployed`);

  const decodedResult = decodeRaidDatum(datum);
  if (!decodedResult.ok)
    return Err(`Decoding Datum error: ${decodedResult.error}`);

  const { creator: creatorPubKeyHash } = decodedResult.data;

  const burnAssets: Assets = {
    [unit]: -1n,
  };

  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .readFrom([raidMint, raidLock])
      .collectFrom([utxoResult.data], RaidClose())
      .mintAssets(burnAssets, RaidRemove())
      .addSigner(
        credentialToAddress(
          lucidNetwork,
          keyHashToCredential(creatorPubKeyHash)
        )
      )
      .attachMetadata(674, {
        msg: ["Remove Raid"],
      })
      .complete({ localUPLCEval: false })
  ).complete();
  if (!txComplete.ok) return Err(`Building Tx: ${txComplete.error}`);
  return Ok(txComplete.data);
};

const list = async (
  blockfrostApiKey: string
): Promise<Result<string[], string>> => {
  const lucidResult = await mayFailAsync(() =>
    getLucid(blockfrostApiKey)
  ).complete();
  if (!lucidResult.ok)
    return Err(`Making Lucid Evolution error: ${lucidResult.error}`);
  const lucid = lucidResult.data;

  const deployedConfigResult = await getDeployedConfig(lucid);
  if (!deployedConfigResult.ok)
    return Err(`Deployed Config error: ${deployedConfigResult.error}`);

  const { raidLock, raidMint } = deployedConfigResult.data;
  if (!raidLock.scriptRef || !raidMint.scriptRef)
    return Err(`Deploy Raid Contracts: Script Not Found`);

  const raidPolicyId = validatorToScriptHash(raidMint.scriptRef);
  const blockfrostApi = getBlockfrostApi(blockfrostApiKey);
  const raiderAssets = await mayFailAsync(() =>
    blockfrostApi.assetsPolicyByIdAll(raidPolicyId)
  ).complete();

  if (!raiderAssets.ok)
    return Err(`Getting Raider Assets error: ${raiderAssets.error}`);
  const validRaiderAssets = raiderAssets.data.filter(
    (asset) => asset.quantity == "1"
  );

  return Ok(validRaiderAssets.map((asset) => asset.asset));
};

export { claim, create, createWithAuthorizer, list, remove };
