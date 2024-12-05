import {
  applyDoubleCborEncoding,
  applyParamsToScript,
  MintingPolicy,
  SpendingValidator,
} from "@lucid-evolution/lucid";
import fs from "fs/promises";
import path from "path";
import { convertError, getDirname, mayFail } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

import { getNativeSigScript } from "./common.js";

const plutusPath = path.join(getDirname(import.meta.url), "../../plutus.json");

const readParameterLockSpendingValidator = async (
  adminPubKeyHash: string
): Promise<Result<MintingPolicy, string>> => {
  const spendingValidator = mayFail(() => getNativeSigScript(adminPubKeyHash));
  if (!spendingValidator.ok) return Err(spendingValidator.error);
  return Ok(spendingValidator.data);
};

const readParameterMintingPolicy = async (
  adminPubKeyHash: string,
  parameterLockerScriptHash: string
): Promise<Result<MintingPolicy, string>> => {
  try {
    const { compiledCode } = JSON.parse(await fs.readFile(plutusPath, "utf8"))
      .validators[0];

    const appliedCompiledCode = applyParamsToScript(
      applyDoubleCborEncoding(compiledCode),
      [adminPubKeyHash, parameterLockerScriptHash]
    );
    return Ok({
      type: "PlutusV2",
      script: applyDoubleCborEncoding(appliedCompiledCode),
    });
  } catch (err) {
    console.log({ err });
    return Err(convertError(err));
  }
};

const readRaidMintingPolicy = async (
  parameterNftPolicyId: string
): Promise<Result<MintingPolicy, string>> => {
  try {
    const { compiledCode } = JSON.parse(await fs.readFile(plutusPath, "utf8"))
      .validators[2];

    const appliedCompiledCode = applyParamsToScript(
      applyDoubleCborEncoding(compiledCode),
      [parameterNftPolicyId]
    );

    return Ok({
      type: "PlutusV2",
      script: applyDoubleCborEncoding(appliedCompiledCode),
    });
  } catch (err) {
    return Err(convertError(err));
  }
};

const readRaidLockSpendingValidator = async (
  adminPubKeyHash: string,
  raidPolicyId: string
): Promise<Result<SpendingValidator, string>> => {
  try {
    const { compiledCode } = JSON.parse(await fs.readFile(plutusPath, "utf8"))
      .validators[1];

    const appliedCompiledCode = applyParamsToScript(
      applyDoubleCborEncoding(compiledCode),
      [adminPubKeyHash, raidPolicyId]
    );

    return Ok({
      type: "PlutusV2",
      script: applyDoubleCborEncoding(appliedCompiledCode),
    });
  } catch (err) {
    return Err(convertError(err));
  }
};

export {
  readParameterLockSpendingValidator,
  readParameterMintingPolicy,
  readRaidLockSpendingValidator,
  readRaidMintingPolicy,
};
