import { assert, describe } from "vitest";

import { deploy } from "../deploy.js";
import {
  parameterMint,
  raidClaim,
  raidCreate,
  raidCreateWithAuthorizer,
  raidRemove,
} from "../index.js";
import { myTest } from "./setup.js";

describe("raid test", () => {
  myTest(
    "can mint parameter nft",
    async ({ accounts, config, emulator, lucid, referenceUtxos }) => {
      const {
        adminAccount,
        projectAccount,
        authroizerAccount1,
        authroizerAccount2,
      } = accounts;
      const txResult = await parameterMint(
        lucid,
        adminAccount.address,
        projectAccount.address,
        [authroizerAccount1.address, authroizerAccount2.address],
        config.feePercentage
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(adminAccount.seedPhrase);
      const txHash = await (
        await txResult.data.sign.withWallet().complete()
      ).submit();
      emulator.awaitBlock(10);

      const utxos = await lucid.utxosByOutRef([{ txHash, outputIndex: 0 }]);
      referenceUtxos.parameterRefUtxo = utxos[0];
    }
  );

  myTest(
    "deploy raid mint and raid lock validators",
    async ({ accounts, lucid }) => {
      const { adminAccount, fundAccount } = accounts;

      const result = await deploy(
        lucid,
        adminAccount.address,
        fundAccount.seedPhrase,
        true
      );
      assert(result.ok, "Tx Failed");
    }
  );

  myTest(
    "can create raid",
    async ({ accounts, emulator, lucid, referenceUtxos, result }) => {
      const { userAccount1 } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");

      const quantity = 1;
      const price = 10_000_000n;
      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      const txResult = await raidCreate(
        lucid,
        quantity,
        price,
        userAccount1.address,
        referenceUtxos.parameterRefUtxo,
        true
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      await (await txResult.data.tx.sign.withWallet().complete()).submit();
      emulator.awaitBlock(10);
      result.raidUnits.push(txResult.data.assetId);
    }
  );

  myTest(
    "can create raid without paying fee",
    async ({ accounts, emulator, lucid, referenceUtxos, result }) => {
      const { userAccount1, authroizerAccount1 } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");

      const quantity = 1;
      const price = 10_000_000n;
      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      const txResult = await raidCreateWithAuthorizer(
        lucid,
        quantity,
        price,
        userAccount1.address,
        authroizerAccount1.address,
        referenceUtxos.parameterRefUtxo,
        true
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(authroizerAccount1.seedPhrase);
      txResult.data.tx.sign.withWallet();
      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      await (await txResult.data.tx.sign.withWallet().complete()).submit();
      emulator.awaitBlock(10);
      result.raidUnits.push(txResult.data.assetId);
    }
  );

  myTest(
    "can claim raid",
    async ({ accounts, emulator, lucid, referenceUtxos, result }) => {
      const { userAccount2, adminAccount } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");
      assert(result.raidUnits.length > 0, "Raid is not minted yet");

      lucid.selectWallet.fromSeed(userAccount2.seedPhrase);
      const txResult = await raidClaim(
        lucid,
        adminAccount.address,
        result.raidUnits[0],
        true
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(adminAccount.seedPhrase);
      const txSigned = txResult.data.sign.withWallet();
      lucid.selectWallet.fromSeed(userAccount2.seedPhrase);
      await (await txSigned.sign.withWallet().complete()).submit();
      emulator.awaitBlock(10);
    }
  );

  myTest(
    "can not claim raid",
    async ({ accounts, lucid, referenceUtxos, result }) => {
      const { userAccount2, adminAccount } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");
      assert(result.raidUnits.length > 0, "Raid is not minted yet");

      lucid.selectWallet.fromSeed(userAccount2.seedPhrase);
      const txResult = await raidClaim(
        lucid,
        adminAccount.address,
        result.raidUnits[0],
        true
      );
      assert(!txResult.ok, "Tx Successed");
      assert(
        txResult.error.includes("quantity must be greater than 0 to claim"),
        "Error is not expected"
      );
    }
  );

  myTest(
    "can remove raid",
    async ({ accounts, emulator, lucid, referenceUtxos, result }) => {
      const { userAccount1 } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");
      assert(result.raidUnits.length > 0, "Raid is not minted yet");

      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      const txResult = await raidRemove(lucid, result.raidUnits[0], true);
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(userAccount1.seedPhrase);
      await (await txResult.data.sign.withWallet().complete()).submit();
      emulator.awaitBlock(10);
    }
  );
});
