import {
  LucidEvolution,
  validatorToAddress,
  validatorToScriptHash,
} from "@lucid-evolution/lucid";
import { Err, Ok } from "ts-res";

import {
  readParameterLockSpendingValidator,
  readParameterMintingPolicy,
  readRaidLockSpendingValidator,
  readRaidMintingPolicy,
} from "../utils/index.js";

const getConfig = async (lucid: LucidEvolution, adminPubKeyHash: string) => {
  const parameterLockSpendingValidator =
    await readParameterLockSpendingValidator(adminPubKeyHash);
  if (!parameterLockSpendingValidator.ok)
    return Err(parameterLockSpendingValidator.error);
  const parameterLockerScriptHash = validatorToScriptHash(
    parameterLockSpendingValidator.data
  );
  const parameterLockerAddress = validatorToAddress(
    lucid.config().network,
    parameterLockSpendingValidator.data
  );

  const parameterMintingPolicy = await readParameterMintingPolicy(
    adminPubKeyHash,
    parameterLockerScriptHash
  );
  if (!parameterMintingPolicy.ok) return Err(parameterMintingPolicy.error);
  const parameterNftPolicyId = validatorToScriptHash(
    parameterMintingPolicy.data
  );

  const raidMintingPolicy = await readRaidMintingPolicy(parameterNftPolicyId);
  if (!raidMintingPolicy.ok) return Err(raidMintingPolicy.error);
  const raidPolicyId = validatorToScriptHash(raidMintingPolicy.data);

  const raidLockSpendingValidator = await readRaidLockSpendingValidator(
    adminPubKeyHash,
    raidPolicyId
  );
  if (!raidLockSpendingValidator.ok)
    return Err(raidLockSpendingValidator.error);
  const raidLockerScriptHash = validatorToScriptHash(
    raidLockSpendingValidator.data
  );
  const raidLockerAddress = validatorToAddress(
    lucid.config().network,
    raidLockSpendingValidator.data
  );

  return Ok({
    parameterLock: {
      validator: parameterLockSpendingValidator.data,
      scriptHash: parameterLockerScriptHash,
      address: parameterLockerAddress,
    },
    parameterMint: {
      validator: parameterMintingPolicy.data,
      policyId: parameterNftPolicyId,
    },
    raidMint: {
      validator: raidMintingPolicy.data,
      policyId: raidPolicyId,
    },
    raidLock: {
      validator: raidLockSpendingValidator.data,
      scriptHash: raidLockerScriptHash,
      address: raidLockerAddress,
    },
  });
};

export { getConfig };
export * from "./deployed.js";
