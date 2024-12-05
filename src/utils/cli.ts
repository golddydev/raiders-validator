import { LucidEvolution } from "@lucid-evolution/lucid";
import { Command } from "commander";
import { Decimal } from "decimal.js";
import Enquirer from "enquirer";
import parse from "parse-duration";
import { get, getLucid } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

const parseQuantity = (program: Command, quantity: string): number => {
  const value = Number(quantity);
  if (Number.isNaN(value) || !Number.isFinite(value))
    return program.error("Invalid quantity given");

  try {
    if (value == parseInt(quantity) && value > 0) return value;
    program.error("Quantity must be integer and greater than 0");
  } catch {
    program.error("Invalid quantity given");
  }
};

const parseAmount = (
  program: Command,
  amount: string,
  decimals: number = 6
): bigint => {
  try {
    return BigInt(
      new Decimal(amount).mul(new Decimal(10).pow(decimals)).toFixed(0)
    );
  } catch {
    program.error("Invalid decimal given");
  }
};

const parseTxHash = (program: Command, txHash: string) => {
  if (txHash.trim().match(/^[0-9a-fA-F]{64}$/g)) {
    return txHash;
  }

  program.error(`Invalid Tx Hash: ${txHash}`);
};

const parseTxIndex = (program: Command, txIndex: string) => {
  if (Number(txIndex) === parseInt(txIndex) && parseInt(txIndex) >= 0)
    return parseInt(txIndex);

  program.error(`Invalid Tx Index: ${txIndex}`);
};

const parseTokenId = (program: Command, tokenId: string) => {
  if (tokenId.trim().match(/lovelace/i)) return "lovelace";
  if (/^([a-fA-F0-9]{2}){29,}$/.test(tokenId.trim())) return tokenId.trim();

  program.error(`Invalid Token Id: ${tokenId}`);
};

const parseDuration = (program: Command, duration: string) => {
  const parsed = parse(duration.trim());

  if (parsed) {
    return parsed;
  }

  program.error(`Invalid Duration: ${duration}`);
};

const requestSeed = async (): Promise<Result<string, string>> => {
  try {
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: "password",
      name: "seed",
      message: "Enter seed phrase for funding wallet:\n",
    });

    if (
      !(
        response &&
        "seed" in response &&
        typeof response.seed == "string" &&
        response.seed.trim()
      )
    ) {
      return Err("Input seed correctly.");
    }

    return Ok(response.seed.trim());
  } catch {
    return Err("Input seed correctly");
  }
};

const getSeed = async (program: Command, seed?: string): Promise<string> => {
  if (seed) return seed;
  const seedResult = await requestSeed();
  if (!seedResult.ok) program.error(seedResult.error);

  return seedResult.data;
};

const lucidLoader = async (
  address?: string
): Promise<Result<LucidEvolution, string>> => {
  const blockfrostApiKey = get("BLOCKFROST_API_KEY", "string");
  if (!blockfrostApiKey.ok) return Err(blockfrostApiKey.error);
  const lucid = await getLucid(blockfrostApiKey.data);

  if (address)
    lucid.selectWallet.fromAddress(address, await lucid.utxosAt(address));
  return Ok(lucid);
};

export {
  getSeed,
  lucidLoader,
  parseAmount,
  parseDuration,
  parseQuantity,
  parseTokenId,
  parseTxHash,
  parseTxIndex,
};
