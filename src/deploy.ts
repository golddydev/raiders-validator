import {
  Data,
  LucidEvolution,
  OutRef,
  UTxO,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import fs from "fs/promises";
import path from "path";
import { getDirname, getPaymentKey, mayFailAsync } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

import { getConfig } from "./config/index.js";
import { createAlwaysFailScript } from "./utils/index.js";

const deployedPath = path.join(getDirname(import.meta.url), "../deployed");

const deploy = async (
  lucid: LucidEvolution,
  adminAddress: string,
  seed: string,
  isTesting: boolean = false
): Promise<Result<void, string>> => {
  const lucidNetwork = lucid.config().network;
  if (!lucidNetwork) return Err("Lucid Network is not set");

  const adminPubKeyHash = getPaymentKey(adminAddress);
  if (!adminPubKeyHash.ok) return Err(adminPubKeyHash.error);

  const configResult = await getConfig(lucid, adminPubKeyHash.data);
  if (!configResult.ok)
    return Err(`Error loading config: ${configResult.error}`);

  const config = configResult.data;
  const { raidMint, raidLock } = config;

  lucid.selectWallet.fromSeed(seed);

  const alwaysFailScript = createAlwaysFailScript();
  const deployedDestination = validatorToAddress(
    lucidNetwork,
    alwaysFailScript
  );

  const network = lucidNetwork.toLowerCase();
  const txComplete = await mayFailAsync(() =>
    lucid
      .newTx()
      .pay.ToAddressWithData(
        deployedDestination,
        {
          kind: "inline",
          value: Data.void(),
        },
        undefined,
        raidMint.validator
      )
      .pay.ToAddressWithData(
        deployedDestination,
        {
          kind: "inline",
          value: Data.void(),
        },
        undefined,
        raidLock.validator
      )
      .attachMetadata(674, {
        msg: ["Deploy Raid Contracts"],
      })
      .complete()
  ).complete();
  if (!txComplete.ok) return Err(txComplete.error);

  console.log(`Deploying on ${network}...\n`);
  const txHash = await mayFailAsync(async () =>
    (await txComplete.data.sign.withWallet().complete()).submit()
  ).complete();
  if (!txHash.ok) return Err(txHash.error);

  await lucid.awaitTx(txHash.data);

  let onchain: UTxO[] = [];
  const refs: OutRef[] = [
    { txHash: txHash.data, outputIndex: 0 },
    { txHash: txHash.data, outputIndex: 1 },
  ];

  while (onchain.length == 0) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    onchain = await lucid.utxosByOutRef(refs);
  }

  console.log("Successfully deployed on-chain\n");

  const jsonReplacer = (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value;
  const deployedRaidMint = JSON.stringify(onchain[0], jsonReplacer);
  const deployedRaidLock = JSON.stringify(onchain[1], jsonReplacer);
  await fs.writeFile(
    `${deployedPath}/${network}/raid-mint${isTesting ? "-test" : ""}.json`,
    deployedRaidMint
  );
  await fs.writeFile(
    `${deployedPath}/${network}/raid-lock${isTesting ? "-test" : ""}.json`,
    deployedRaidLock
  );

  console.log("Saved raid mint and raid lock");
  return Ok();
};

export { deploy, deployedPath };
