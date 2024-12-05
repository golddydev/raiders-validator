import {
  Credential,
  credentialToAddress,
  Data,
  getAddressDetails,
  Network,
} from "@lucid-evolution/lucid";
import { mayFail } from "raiders-helper";
import { Err, Ok, Result } from "ts-res";

const VerificationKeyCredentialSchema = Data.Object({
  VerificationKeyHash: Data.Object({ hash: Data.Bytes() }),
});

const ScriptCredentialSchema = Data.Object({
  ScriptHash: Data.Object({ hash: Data.Bytes() }),
});
const CredentialSchema = Data.Enum([
  VerificationKeyCredentialSchema,
  ScriptCredentialSchema,
]);
type CredentialSchemaType = Data.Static<typeof CredentialSchema>;

const StakeCredentialSchema = Data.Object({
  inline: CredentialSchema,
});
type StakeCredentialSchemaType = Data.Static<typeof StakeCredentialSchema>;

const AddressSchema = Data.Object({
  paymentCredential: CredentialSchema,
  stakeCredential: Data.Nullable(StakeCredentialSchema),
});
type AddressSchemaType = Data.Static<typeof AddressSchema>;

const convertCredentialToSchemaType = (
  credential: Credential
): CredentialSchemaType => {
  return credential.type == "Key"
    ? { VerificationKeyHash: { hash: credential.hash } }
    : { ScriptHash: { hash: credential.hash } };
};

const convertSchemaTypeToCredential = (
  schema: CredentialSchemaType
): Credential => {
  if ("VerificationKeyHash" in schema)
    return { type: "Key", hash: schema.VerificationKeyHash.hash };
  return { type: "Script", hash: schema.ScriptHash.hash };
};

const convertAddressToSchemaType = (
  address: string
): Result<AddressSchemaType, string> => {
  const detailResult = mayFail(() => getAddressDetails(address));
  if (!detailResult.ok) return Err(`Not a valid address`);
  const { paymentCredential, stakeCredential } = detailResult.data;
  if (!paymentCredential) return Err(`Not a Payment address`);

  const paymentCred = convertCredentialToSchemaType(paymentCredential);
  const stakeCred: StakeCredentialSchemaType | null = stakeCredential
    ? { inline: convertCredentialToSchemaType(stakeCredential) }
    : null;

  return Ok({
    paymentCredential: paymentCred,
    stakeCredential: stakeCred,
  });
};

const convertSchemaTypeToAddress = (
  network: Network,
  schema: AddressSchemaType
): Result<string, string> => {
  const { paymentCredential, stakeCredential } = schema;
  const address = mayFail(() =>
    credentialToAddress(
      network,
      convertSchemaTypeToCredential(paymentCredential),
      stakeCredential
        ? convertSchemaTypeToCredential(stakeCredential.inline)
        : undefined
    )
  );
  if (!address.ok) return Err(address.error);
  return Ok(address.data);
};

export {
  AddressSchema,
  convertAddressToSchemaType,
  convertSchemaTypeToAddress,
};
