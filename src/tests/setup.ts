import {
  Emulator,
  generateEmulatorAccount,
  Lucid,
  Network,
  UTxO,
} from "@lucid-evolution/lucid";
import { test } from "vitest";

const network: Network = "Preprod";

const setup = async () => {
  const adminAccount = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const projectAccount = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const fundAccount = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const userAccount1 = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const userAccount2 = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const authroizerAccount1 = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const authroizerAccount2 = generateEmulatorAccount({
    lovelace: 5_000_000_000n,
  });
  const emulator = new Emulator([
    adminAccount,
    projectAccount,
    fundAccount,
    userAccount1,
    userAccount2,
    authroizerAccount1,
    authroizerAccount2,
  ]);
  const lucid = await Lucid(emulator, network);

  const config = {
    feePercentage: 20,
  };

  const referenceUtxos = {
    parameterRefUtxo: undefined as UTxO | undefined,
  };

  const result = {
    raidUnits: [] as string[],
  };

  return {
    accounts: {
      adminAccount,
      projectAccount,
      fundAccount,
      userAccount1,
      userAccount2,
      authroizerAccount1,
      authroizerAccount2,
    },
    config,
    lucid,
    emulator,
    referenceUtxos,
    result,
  };
};

const shinkaiTest = test.extend(await setup());

export { shinkaiTest };
