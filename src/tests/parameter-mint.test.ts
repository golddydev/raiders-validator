import { assert, describe } from "vitest";

import { burn, mint } from "../parameter.js";
import { myTest } from "./setup.js";

describe("parameter test", () => {
  myTest(
    "can mint parameter nft",
    async ({ accounts, config, emulator, lucid, referenceUtxos }) => {
      const { adminAccount, projectAccount } = accounts;
      const txResult = await mint(
        lucid,
        adminAccount.address,
        projectAccount.address,
        [],
        config.feePercentage
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(adminAccount.seedPhrase);
      const txHash = await (
        await txResult.data.sign.withWallet().complete()
      ).submit();
      emulator.awaitBlock(10);

      const utxos = await lucid.utxosByOutRef([
        { txHash: txHash, outputIndex: 0 },
      ]);
      referenceUtxos.parameterRefUtxo = utxos[0];
    }
  );

  myTest(
    "can burn parameter nft",
    async ({ accounts, emulator, lucid, referenceUtxos }) => {
      const { adminAccount } = accounts;
      assert(referenceUtxos.parameterRefUtxo, "Parameter Ref UTxO not found");

      const parameterNftUnit = Object.keys(
        referenceUtxos.parameterRefUtxo.assets
      ).find((unit) => unit != "lovelace");
      assert(parameterNftUnit, "Parameter Ref NFT not found");

      const txResult = await burn(
        lucid,
        adminAccount.address,
        parameterNftUnit
      );
      assert(txResult.ok, "Tx Failed");

      lucid.selectWallet.fromSeed(adminAccount.seedPhrase);
      await (await txResult.data.sign.withWallet().complete()).submit();
      emulator.awaitBlock(10);

      referenceUtxos.parameterRefUtxo = undefined;
    }
  );
});
