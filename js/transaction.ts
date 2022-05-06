import type { Wallet } from "@saberhq/solana-contrib";
import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import {
  MINT_POOL_PROGRAM_ID,
  MINT_POOL_IDL,
  findMintPoolId,
  MINT_POOL_PROGRAM,
} from ".";

export async function withInitMintPool(
  connection: web3.Connection,
  wallet: Wallet,
  transaction: web3.Transaction,
  params: {
    poolName: string;
    mint: web3.PublicKey;
    mintAuthority: web3.PublicKey;
    maxSupply: number;
    price: anchor.BN;
    feeWallet: web3.PublicKey;
  }
): Promise<web3.Transaction> {
  const provider = new anchor.Provider(connection, wallet, {});
  const mintPool = new anchor.Program<MINT_POOL_PROGRAM>(
    MINT_POOL_IDL,
    MINT_POOL_PROGRAM_ID,
    provider
  );

  const [mintPoolId, bump] = await findMintPoolId(params.mint);

  transaction.add(
    mintPool.instruction.initMintPool(
      {
        bump,
        mint: params.mint,
        name: params.poolName,
        maxSupply: new anchor.BN(params.maxSupply),
        price: params.price,
        wallet: params.feeWallet,
      },
      {
        accounts: {
          mintPool: mintPoolId,
          mint: params.mint,
          mintAuthority: params.mintAuthority,

          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,

          rent: web3.SYSVAR_RENT_PUBKEY,
          payer: wallet.publicKey,
        },
      }
    )
  );
  return transaction;
}

export async function withMint(
  connection: web3.Connection,
  wallet: Wallet,
  transaction: web3.Transaction,
  params: {
    user: web3.PublicKey;
    mint: web3.PublicKey;
    mintTokenAccount: web3.PublicKey;
    feeWallet: web3.PublicKey;
  }
): Promise<web3.Transaction> {
  const provider = new anchor.Provider(connection, wallet, {});
  const mintPool = new anchor.Program<MINT_POOL_PROGRAM>(
    MINT_POOL_IDL,
    MINT_POOL_PROGRAM_ID,
    provider
  );

  const [mintPoolId, bump] = await findMintPoolId(params.mint);

  transaction.add(
    mintPool.instruction.mint({
      accounts: {
        mintPool: mintPoolId,
        user: params.user,

        mint: params.mint,

        wallet: params.feeWallet,

        mintTokenAccount: params.mintTokenAccount,

        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      },
    })
  );

  return transaction;
}