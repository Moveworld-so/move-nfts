import * as web3 from "@solana/web3.js";
import { BorshAccountsCoder, Program, Provider } from "@project-serum/anchor";
import {
  AccountData,
  MINT_POOL_IDL,
  MintPoolData,
  MINT_POOL_PROGRAM,
  MINT_POOL_PROGRAM_ID,
} from "./constants";

export const getMintPools = async (
  connection: web3.Connection,
  mintPoolIds: web3.PublicKey[]
): Promise<AccountData<MintPoolData>[]> => {
  const provider = new Provider(connection, null, {});
  const mintPoolProgram = new Program<MINT_POOL_PROGRAM>(
    MINT_POOL_IDL,
    MINT_POOL_PROGRAM_ID,
    provider
  );

  let mintPools = [];
  try {
    mintPools = await mintPoolProgram.account.mintPool.fetchMultiple(
      mintPoolIds
    );
  } catch (e) {
    console.log(e);
  }
  return mintPools.map((tm, i) => ({
    parsed: tm,
    pubkey: mintPoolIds[i],
  }));
};

export const getAllMintPools = async (
  connection: web3.Connection
): Promise<AccountData<MintPoolData>[]> => {
  const programAccounts = await connection.getProgramAccounts(
    MINT_POOL_PROGRAM_ID
  );

  const mintPools: AccountData<MintPoolData>[] = [];
  const coder = new BorshAccountsCoder(MINT_POOL_IDL);
  programAccounts.forEach((account) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nftPoolData: MintPoolData = coder.decode(
        "mintPool",
        account.account.data
      );
      if (nftPoolData) {
        mintPools.push({
          ...account,
          parsed: nftPoolData,
        });
      }
    } catch (e) {
      console.log(`Failed to decode token manager data`);
    }
  });

  return mintPools.sort((a, b) =>
    a.pubkey.toBase58().localeCompare(b.pubkey.toBase58())
  );
};

