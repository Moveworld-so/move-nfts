import * as web3 from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as anchor from '@project-serum/anchor'
import { SignerWallet, Wallet } from '@saberhq/solana-contrib'
import axios from 'axios'

export const METADATA_IGNORE_LIST = []

const AUTHORITY_SECRET_KEY = JSON.parse(process.env.AUTHORITY_SECRET_KEY);
const MINT_POOL_AUHTORITY_FROM_SECRET_KEY = new Uint8Array(AUTHORITY_SECRET_KEY);
let authority = web3.Keypair.fromSecretKey(MINT_POOL_AUHTORITY_FROM_SECRET_KEY)

export let authorityWallet = new SignerWallet(authority)

export const createMint = async (
  connection: web3.Connection,
  creator: web3.Keypair,
  recipient: web3.PublicKey,
  amount = 1,
  freezeAuthority: web3.PublicKey = recipient
): Promise<[web3.PublicKey, splToken.Token]> => {
  const mint = await splToken.Token.createMint(
    connection,
    creator,
    creator.publicKey,
    freezeAuthority,
    0,
    splToken.TOKEN_PROGRAM_ID
  )
  const tokenAccount = await mint.createAssociatedTokenAccount(recipient)
  await mint.mintTo(tokenAccount, creator.publicKey, [], amount)
  return [tokenAccount, mint]
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
  )
  const account = await connection.getAccountInfo(associatedAddress)
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
    )
  }
  return associatedAddress
}

export async function fetchNFT(
  connection: web3.Connection,
  mintId: web3.PublicKey
): Promise<any> {
  const [metaplexId] = await web3.PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
      metaplex.MetadataProgram.PUBKEY.toBuffer(),
      mintId.toBuffer(),
    ],
    metaplex.MetadataProgram.PUBKEY
  )
  let md = await fetchMetaplexData(connection, metaplexId)
  let info = await fetchMetadata(md)
  return info
}

export async function fetchMetaplexData(
  connection: web3.Connection,
  metaplexId: web3.PublicKey
): Promise<metaplex.Metadata> {
  try {
    return await metaplex.Metadata.load(connection, metaplexId)
  } catch (e) {
    console.log(e)
    throw Error('Could not fetch Metaplex metadata')
  }
}

export async function fetchMetadata(
  md: metaplex.Metadata
): Promise<{ pubkey: web3.PublicKey; data: any }> {
  try {
    if (!md?.data.data.uri || METADATA_IGNORE_LIST.includes(md?.data.data.uri))
      throw Error('Not off chain uri to be fetched')
    const json = await axios(md.data.data.uri).then((r) => r.data.json())
    return { pubkey: md.pubkey, data: json }
  } catch (e) {
    console.log(e)
    throw Error('Could not fetch off chain metadata')
  }
}

/**
 * Pay and create mint and token account
 * @param connection
 * @param creator
 * @returns
 */
export const createMintTransaction = async (
  transaction: web3.Transaction,
  connection: web3.Connection,
  wallet: Wallet,
  recipient: web3.PublicKey,
  mintId: web3.PublicKey,
  amount = 1,
  freezeAuthority: web3.PublicKey = recipient
): Promise<[web3.PublicKey, web3.Transaction]> => {
  const mintBalanceNeeded = await splToken.Token.getMinBalanceRentForExemptMint(
    connection
  )
  transaction.add(
    web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintId,
      lamports: mintBalanceNeeded,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      space: splToken.MintLayout.span,
      programId: splToken.TOKEN_PROGRAM_ID,
    })
  )
  transaction.add(
    splToken.Token.createInitMintInstruction(
      splToken.TOKEN_PROGRAM_ID,
      mintId,
      0,
      wallet.publicKey,
      freezeAuthority
    )
  )
  const walletAta = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mintId,
    wallet.publicKey,
    wallet.publicKey
  )
  if (amount > 0) {
    transaction.add(
      splToken.Token.createMintToInstruction(
        splToken.TOKEN_PROGRAM_ID,
        mintId,
        walletAta,
        wallet.publicKey,
        [],
        amount
      )
    )
  }
  return [walletAta, transaction]
}

export const createBurnTransaction = async (
  transaction: web3.Transaction,
  connection: web3.Connection,
  wallet: Wallet,
  mintId: web3.PublicKey,
  amount: number,
): Promise<[web3.PublicKey, web3.Transaction]> => {
  const walletAta = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mintId,
    wallet.publicKey,
    wallet.publicKey
  )

  transaction.add(
    splToken.Token.createBurnInstruction(
      splToken.TOKEN_PROGRAM_ID,
      mintId,
      walletAta,
      wallet.publicKey,
      [],
      amount
    )
  )

  return [walletAta, transaction]
}