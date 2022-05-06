import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

/**
 * Pay and create mint and token account
 * @param connection
 * @param creator
 * @returns
 */
export const createMint = async (
  connection,
  creator: web3.Keypair,
  recipient: web3.PublicKey
): Promise<[web3.PublicKey, splToken.Token]> => {
  var fromAirdropSignature = await connection.requestAirdrop(
    creator.publicKey,
    web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(fromAirdropSignature);
  const mint = await splToken.Token.createMint(
    connection,
    creator,
    creator.publicKey,
    creator.publicKey,
    1,
    splToken.TOKEN_PROGRAM_ID
  );
  const tokenAccount = await mint.createAssociatedTokenAccount(recipient);
  await mint.mintTo(tokenAccount, creator.publicKey, [], 1);
  return [tokenAccount, mint];
};

export async function withFindAssociatedTokenAccount(
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  allowOwnerOffCurve?: boolean
): Promise<web3.PublicKey> {
  const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner,
    allowOwnerOffCurve
  );
  return associatedAddress
}

export async function withFindOrInitAssociatedTokenAccount(
  transaction: web3.Transaction,
  connection: web3.Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  payer: web3.PublicKey,
  allowOwnerOffCurve?: boolean
): Promise<web3.PublicKey> {
  const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner,
    allowOwnerOffCurve
  );
  const account = await connection.getAccountInfo(associatedAddress);
  if (!account) {
    transaction.add(
      splToken.Token.createAssociatedTokenAccountInstruction(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        mint,
        associatedAddress,
        owner,
        payer
      )
    );
  }
  return associatedAddress;
}