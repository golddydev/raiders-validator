import { Data, OutputDatum } from "@lucid-evolution/lucid";
import { mayFail } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

import { AddressSchema, convertAddressToSchemaType } from "./utils/index.js";

const ParameterSchema = Data.Object({
  raiderLockerScriptHash: Data.Bytes(),
  projectAddress: AddressSchema,
  feePercentage: Data.Integer(),
  authorizersPubKeyHashes: Data.Array(Data.Bytes()),
});
type ParameterSchemaType = Data.Static<typeof ParameterSchema>;
const Parameter = ParameterSchema as unknown as ParameterSchemaType;

const RaidDatumSchema = Data.Object({
  quantity: Data.Integer(),
  price: Data.Integer(),
  creator: Data.Bytes(),
});
type RaidDatumSchemaType = Data.Static<typeof RaidDatumSchema>;
const RaidDatum = RaidDatumSchema as unknown as RaidDatumSchemaType;

const makeParameterDatum = (
  raiderLockerScriptHash: string,
  projectAddress: string,
  feePercentage: number,
  authorizersPubKeyHashes: string[]
): Result<OutputDatum, string> => {
  const convertedAddressSchema = convertAddressToSchemaType(projectAddress);
  if (!convertedAddressSchema.ok) return Err(convertedAddressSchema.error);

  const datum = mayFail(() =>
    Data.to(
      {
        raiderLockerScriptHash,
        projectAddress: convertedAddressSchema.data,
        feePercentage: BigInt(Math.max(0, Math.min(100, feePercentage))),
        authorizersPubKeyHashes,
      },
      Parameter
    )
  );
  if (!datum.ok) return Err(datum.error);
  return Ok({ kind: "inline", value: datum.data });
};

const decodeParameterDatum = (
  datum: string
): Result<ParameterSchemaType, string> => {
  const decoded = mayFail(() => Data.from(datum, Parameter));
  if (!decoded.ok) return Err(decoded.error);

  return Ok(decoded.data);
};

const makeRaidDatum = (
  quantity: number,
  price: bigint,
  creatorPubKeyHash: string
): Result<OutputDatum, string> => {
  const datum = mayFail(() =>
    Data.to(
      {
        quantity: BigInt(Math.floor(quantity)),
        price,
        creator: creatorPubKeyHash,
      },
      RaidDatum
    )
  );
  if (!datum.ok) return Err(datum.error);
  return Ok({ kind: "inline", value: datum.data });
};

const decodeRaidDatum = (
  datum: string
): Result<{ quantity: number; price: bigint; creator: string }, string> => {
  const decoded = mayFail(() => Data.from(datum, RaidDatum));
  if (!decoded.ok) return Err(`Invalid Raid Datum`);
  return Ok({
    ...decoded.data,
    quantity: Number(decoded.data.quantity),
  });
};

export {
  decodeParameterDatum,
  decodeRaidDatum,
  makeParameterDatum,
  makeRaidDatum,
  Parameter,
  ParameterSchema,
  RaidDatum,
  RaidDatumSchema,
};
