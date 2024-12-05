use aiken/cbor.{diagnostic}
use aiken/collection/list
use aiken/crypto.{ScriptHash, blake2b_256}
use aiken/primitive/bytearray
use aiken/primitive/string
use cardano/address.{Address, Credential, Script}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{Input, Output, OutputReference, find_input}
use maths/routines.{from_int}

pub fn trace_if_false(predicate: Bool, msg: String) -> Bool {
  if predicate {
    predicate
  } else {
    trace msg
    predicate
  }
}

pub fn get_spending_script_input(
  inputs: List<Input>,
  spending_utxo: OutputReference,
) -> Input {
  when find_input(inputs, spending_utxo) is {
    Some(input) -> input
    _ -> fail @"couldn't find script input"
  }
}

pub fn get_script_hash(
  inputs: List<Input>,
  spending_utxo: OutputReference,
) -> ScriptHash {
  let script_input = get_spending_script_input(inputs, spending_utxo)
  let Input(_, Output(Address(payment_cred, _), ..)) = script_input
  when payment_cred is {
    Script(script_hash) -> script_hash
    _ -> fail @"spending utxo is not from script"
  }
}

pub fn get_first_output_reference(inputs: List<Input>) -> OutputReference {
  when list.at(inputs, 0) is {
    Some(input) -> {
      let Input(output_ref, _) = input
      output_ref
    }
    _ -> fail @"there is no inputs in transaction"
  }
}

pub fn get_unique_token_name(output_ref: OutputReference) -> AssetName {
  let OutputReference(tx_hash, output_index) = output_ref
  blake2b_256(
    tx_hash
      |> bytearray.concat(from_int(output_index)),
  )
}

pub fn inputs_by_payment_credential(
  inputs: List<Input>,
  payment_cred: Credential,
) -> Int {
  inputs
    |> list.count(
        fn(input) {
          let Input(_, Output(Address(p_cred, ..), ..)) = input
          p_cred == payment_cred
        },
      )
}

pub fn get_script_inputs(
  inputs: List<Input>,
  script_hash: ScriptHash,
) -> List<Input> {
  inputs
    |> list.filter(
        fn(input) {
          let Input(_, Output(Address(p_cred, ..), ..)) = input
          p_cred == Script(script_hash)
        },
      )
}

pub fn find_reference_input_with_token(
  reference_inputs: List<Input>,
  protocol_parameter_nft_policy_id: PolicyId,
) -> Input {
  when
    reference_inputs
      |> list.find(
          fn(input) {
            let Input(_, Output(_, input_value, ..)) = input
            input_value
              |> assets.policies()
              |> list.has(protocol_parameter_nft_policy_id)
          },
        )
  is {
    Some(input) -> input
    None ->
      fail string.concat(
        @"reference input not found with token ",
        diagnostic(protocol_parameter_nft_policy_id),
      )
  }
}
