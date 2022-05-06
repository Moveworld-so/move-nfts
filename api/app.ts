import * as anchor from '@project-serum/anchor';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import * as web3 from '@solana/web3.js';
import * as bs from 'base58-js';
import { getAllMintPools } from '../js/accounts';
import { burn, createMintPool, mint, update } from "./mint-pool";


(async () => {
  // const publicKey = bs.base58_to_binary('PUBLIC_KEY');
  // const secretKey = bs.base58_to_binary('SECRET_KEY');
  // const userKeyPair = new web3.Keypair({ publicKey, secretKey });
  
  const AUTHORITY_SECRET_KEY = JSON.parse(process.env.AUTHORITY_SECRET_KEY);
  const MINT_POOL_AUHTORITY_FROM_SECRET_KEY = new Uint8Array(AUTHORITY_SECRET_KEY);
  let mintPoolAuthority = web3.Keypair.fromSecretKey(
    MINT_POOL_AUHTORITY_FROM_SECRET_KEY
  );
  const wallet = new anchor.Wallet(mintPoolAuthority);

  const connection = new web3.Connection(
    'https://api.devnet.solana.com', 
    'confirmed',
  );

  // await createMintPool(
  //   connection,
  //   wallet,
  //   'TestMintName',
  //   'TMN',
  //   500,
  //   'https://arweave.net/yaqNhHdQXnX49eUKcpThioeG03OXDMi-Kggav3HQR18',
  //   100,
  //   0.5 * web3.LAMPORTS_PER_SOL,
  //   wallet.publicKey,
  //   [
  //     new Creator({ address: 'DLTUbCJ5yR1sqox5fVP1RwhRQmr9w3az2APrjkoxt6f4', share: 100, verified: false })
  //   ]
  // )

  // console.log('Mint Pool Created');

  let mintPools = await getAllMintPools(connection);

  const mintPool = mintPools[mintPools.length - 1];

  // await mint(connection, wallet, mintPool);

  // console.log('Minted ', mintPool.parsed.mint.toBase58());

  // await burn(connection, wallet, mintPool.parsed.mint, 1);

  // console.log('Burned');

  await update(connection, wallet,
    'TestMintName2',
    'TNM2',
    400,
    'https://arweave.net/mHcOb9nxo5u3-BvZ3X9xYTBdO5L6vIIckpURCNJv2RM',
    [
      new Creator({ address: 'DLTUbCJ5yR1sqox5fVP1RwhRQmr9w3az2APrjkoxt6f4', share: 100, verified: false })
    ],
    mintPool.parsed.mint
    )

  console.log('Updated');  
})();