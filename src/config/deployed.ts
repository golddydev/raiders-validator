import { LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import path from "path";
import { Err, Ok, Result } from "ts-res";

import { deployedPath } from "../deploy.js";
import { loadUtxoFromFile } from "../utils/index.js";

const getDeployedConfig = async (
  lucid: LucidEvolution,
  isTesting: boolean = false
): Promise<Result<{ raidLock: UTxO; raidMint: UTxO }, string>> => {
  const network = lucid.config().network.toLowerCase();
  const raidLockDeployed = await loadUtxoFromFile(
    path.join(
      deployedPath,
      `/${network}/raid-lock${isTesting ? "-test" : ""}.json`
    )
  );
  if (!raidLockDeployed.ok)
    return Err(`Raid Lock Deployed error: ${raidLockDeployed.error}`);
  if (!raidLockDeployed.data.scriptRef)
    return Err(`Raid Lock Deployed error: Script Not Found`);

  const raidMintDeployed = await loadUtxoFromFile(
    path.join(
      deployedPath,
      `/${network}/raid-mint${isTesting ? "-test" : ""}.json`
    )
  );
  if (!raidMintDeployed.ok)
    return Err(`Raid Mint Deployed error: ${raidMintDeployed.error}`);
  if (!raidLockDeployed.data.scriptRef)
    return Err(`Raid Mint Deployed error: Script Not Found`);

  return Ok({
    raidLock: raidLockDeployed.data,
    raidMint: raidMintDeployed.data,
  });
};

export { getDeployedConfig };
