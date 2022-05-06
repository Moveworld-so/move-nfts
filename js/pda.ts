import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  MINT_POOL_SEED,
  MINT_POOL_PROGRAM_ID,
} from "./constants";

export const findMintPoolId = async (mintId: PublicKey) => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(MINT_POOL_SEED), mintId.toBytes()],
    MINT_POOL_PROGRAM_ID
  );
};
