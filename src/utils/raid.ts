const calcRequiredBounty = (quantity: number, price: bigint): bigint => {
  return BigInt(Math.floor(quantity)) * price + 2_000_000n;
};

const calcBountyFee = (
  feePercentage: bigint,
  quantity: number,
  price: bigint
): bigint => {
  if (feePercentage >= 100) return BigInt(Math.floor(quantity)) * price;
  return (BigInt(Math.floor(quantity)) * price * feePercentage) / 100n;
};

export { calcBountyFee, calcRequiredBounty };
