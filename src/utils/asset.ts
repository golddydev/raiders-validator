import { UTxO } from "@lucid-evolution/lucid";
import { blake2b } from "@noble/hashes/blake2b";
import { bytesToHex } from "@noble/hashes/utils";

const generateUniqueAssetName = (utxo: UTxO) => {
  const convertDecimalToHex = (num: number) => {
    if (num == 0) return "";
    const hex = Math.abs(num).toString(16);
    return hex.length % 2 ? "0" + hex : hex;
  };

  const name = bytesToHex(
    blake2b
      .create({ dkLen: 32 })
      .update(
        Buffer.from(utxo.txHash + convertDecimalToHex(utxo.outputIndex), "hex")
      )
      .digest()
  );
  return name;
};

export { generateUniqueAssetName };
