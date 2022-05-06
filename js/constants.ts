import type { AnchorTypes } from "@saberhq/anchor-contrib";

import * as MINT_POOL_TYPES from "../target/types/mint_pool";
import { PublicKey } from "@solana/web3.js";

export const MINT_POOL_PROGRAM_ID = new PublicKey(
  "CpYpw2Z6buf1vAGAmZPNz57pJadnrACJ1B3GJHNCSae8"
);
export const MINT_POOL_SEED = "mint-pool";

export const MINT_POOL_IDL = MINT_POOL_TYPES.IDL;

export type MINT_POOL_PROGRAM = MINT_POOL_TYPES.MintPool;

export type MintPoolTypes = AnchorTypes<
  MINT_POOL_PROGRAM
>;

export type TokenManagerError = MintPoolTypes["Error"];

type Accounts = MintPoolTypes["Accounts"];

export type MintPoolData = Accounts["mintPool"];

export type AccountData<T> = {
  pubkey: PublicKey;
  parsed: T;
};
