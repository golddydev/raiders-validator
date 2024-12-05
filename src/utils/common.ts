import { Script, scriptFromNative, UTxO } from "@lucid-evolution/lucid";
import fs from "fs/promises";
import { convertError } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

const getNativeSigScript = (pubkeyHash: string): Script => {
  const script = scriptFromNative({
    type: "sig",
    keyHash: pubkeyHash,
  });
  return script;
};

const createAlwaysFailScript = (): Script => {
  const header = "5839010000322253330033371e9101203";
  const body = Array.from({ length: 63 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const footer = "0048810014984d9595cd01";

  return {
    type: "PlutusV2",
    script: `${header}${body}${footer}`,
  };
};

const loadUtxoFromFile = async (
  path: string
): Promise<Result<UTxO, string>> => {
  try {
    const utxo: UTxO = JSON.parse(await fs.readFile(path, "utf8"));

    for (const asset in utxo.assets) {
      utxo.assets[asset] = BigInt(utxo.assets[asset]);
    }

    return Ok(utxo);
  } catch (err) {
    return Err(convertError(err));
  }
};

export { createAlwaysFailScript, getNativeSigScript, loadUtxoFromFile };
