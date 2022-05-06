import * as anchor from '@project-serum/anchor'
import * as web3 from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { createBurnTransaction, createMintTransaction, withFindOrInitAssociatedTokenAccount } from './utils'
import {
  CreateMetadataV2,
  Creator,
  DataV2,
  Metadata,
  UpdateMetadataV2,
} from '@metaplex-foundation/mpl-token-metadata'
import { AccountData, MintPoolData, withInitMintPool, withMint } from '../js'

export const asNodeWallet = (wallet: Wallet): anchor.Wallet => {
  return {
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
    publicKey: wallet.publicKey,
    payer: web3.Keypair.generate(),
  }
}

export async function createMintPool(
  connection: web3.Connection,
  wallet: Wallet,
  mintName: string,
  mintSymbol: string,
  sellerFeeBasisPoints: number,
  uri: string,
  maxSupply: number,
  price: number,
  feeWallet: web3.PublicKey,
  creators: Creator[]
) {
  const mint = web3.Keypair.generate()
  const transaction = new web3.Transaction()
  await createMintTransaction(
    transaction,
    connection,
    wallet,
    wallet.publicKey,
    mint.publicKey,
    0
  )

  const masterEditionMetadataId = await Metadata.getPDA(mint.publicKey)
  const metadataTx = new CreateMetadataV2(
    { feePayer: wallet.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: mintName,
        symbol: mintSymbol,
        uri,
        sellerFeeBasisPoints: sellerFeeBasisPoints,
        creators,
        collection: null,
        uses: null,
      }),
      updateAuthority: wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
    }
  )
  transaction.add(...metadataTx.instructions)

  await withInitMintPool(connection, asNodeWallet(wallet), transaction, {
    poolName: mintName,
    mint: mint.publicKey,
    mintAuthority: wallet.publicKey,
    maxSupply: maxSupply,
    price: new anchor.BN(price),
    feeWallet: feeWallet,
  })

  await finalize_tx(connection, wallet, [transaction], mint, {
    notificationConfig: {},
  })
}

export async function mint(
  connection: web3.Connection,
  wallet: Wallet,
  mintPoolData: AccountData<MintPoolData>,
) {
  const transaction = new web3.Transaction()

  const mintTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      mintPoolData.parsed.mint,
      wallet.publicKey,
      wallet.publicKey
    )

  await withMint(connection, asNodeWallet(wallet), transaction, {
    user: wallet.publicKey,
    mint: mintPoolData.parsed.mint,
    mintTokenAccount: mintTokenAccountId,
    feeWallet: mintPoolData.parsed.wallet,
  })

  await finalize_tx(connection, wallet, [transaction], null, {
    notificationConfig: {},
  })
}

export async function burn(
  connection: web3.Connection,
  wallet: Wallet,
  mint: web3.PublicKey,
  amount: number
) {
  const transaction = new web3.Transaction()
  
  await createBurnTransaction(
    transaction,
    connection,
    wallet,
    mint,
    amount
  )

  await finalize_tx(connection, wallet, [transaction], null, {
    notificationConfig: {},
  })
}

export async function update(
  connection: web3.Connection,
  wallet: Wallet,
  mintName: string,
  mintSymbol: string,
  sellerFeeBasisPoints: number,
  uri: string,
  creators: Creator[],
  mint: web3.PublicKey
) {
  const transaction = new web3.Transaction()

  const masterEditionMetadataId = await Metadata.getPDA(mint)

  const metadataTx = new UpdateMetadataV2(
    { feePayer: wallet.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: mintName,
        symbol: mintSymbol,
        uri,
        sellerFeeBasisPoints: sellerFeeBasisPoints,
        creators,
        collection: null,
        uses: null,
      }),
      updateAuthority: wallet.publicKey,
    }
  )
  transaction.add(...metadataTx.instructions)

  await finalize_tx(connection, wallet, [transaction], null, {
    notificationConfig: {},
  })
}

export async function finalize_tx(
  connection: web3.Connection,
  wallet: Wallet,
  transactions: web3.Transaction[],
  signer: web3.Keypair | null,
  config: {
    silent?: boolean
    signers?: web3.Signer[]
    confirmOptions?: web3.ConfirmOptions
    notificationConfig?: { message?: string; errorMessage?: string }
    callback?: Function
  }
) {
  try {
    let blockhash = (await connection.getRecentBlockhash('max')).blockhash
    await Promise.all(
      transactions.map((tr) => {
        tr.feePayer = wallet.publicKey
        tr.recentBlockhash = blockhash
      })
    )

    await wallet.signAllTransactions(transactions)

    const txids = await Promise.all(
      transactions.map((tr) => {
        if (signer != null) {
          tr.partialSign(signer)
        }
        return web3.sendAndConfirmRawTransaction(connection, tr.serialize())
      })
    )
    console.log('Successful tx', txids)
  } catch (e) {
    console.log('Failed transaction: ', e)
    if (!config.silent) throw new Error(`${e}`)
  }
}