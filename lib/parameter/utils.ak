use cardano/assets.{PolicyId}
use cardano/transaction.{Datum, InlineDatum, Input, Output}
use common/utils.{find_reference_input_with_token}
use parameter/types.{Parameter}

fn extract_parameter_from_datum(datum: Datum) -> Parameter {
  when datum is {
    InlineDatum(inline_data) -> {
      expect parameter: Parameter = inline_data
      parameter
    }
    _ -> fail @"parameter datum must be inline"
  }
}

pub fn extract_parameter(
  reference_inputs: List<Input>,
  parameter_nft_policy_id: PolicyId,
) -> Parameter {
  let parameter_input =
    reference_inputs
      |> find_reference_input_with_token(parameter_nft_policy_id)

  let Input(_, Output(_, _, datum, _)) = parameter_input
  extract_parameter_from_datum(datum)
}
