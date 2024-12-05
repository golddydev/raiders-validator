import { Constr, Data } from "@lucid-evolution/lucid";

const ParameterMint = () => Data.to(new Constr(0, []));
const ParameterBurn = () => Data.to(new Constr(1, []));

const RaidCreate = (quantity: number, price: bigint) =>
  Data.to(new Constr(0, [BigInt(Math.floor(quantity)), price]));
const RaidRemove = () => Data.to(new Constr(1, []));
const RaidClaim = () => Data.to(new Constr(0, []));
const RaidClose = () => Data.to(new Constr(1, []));

export {
  ParameterBurn,
  ParameterMint,
  RaidClaim,
  RaidClose,
  RaidCreate,
  RaidRemove,
};
