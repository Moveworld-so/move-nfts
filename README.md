# move-nfts

Create a `treasury.json` file containing wallet keypair to be used for this program.

In order to use the APIs, you just need to install packages using

```
yarn install
```

In order to play with the smart contract itself, you need to install [anchor](https://project-serum.github.io/anchor/getting-started/introduction.html).

Then, use the following command to build the smart contract
```
anchor build
```

and run the tests using
```
anchor test
```

Once built and tested, get the public key of the smart contract using
```
solana-keygen pubkey ./target/deploy/mint_pool-keypair.json  
```
You should have solana-cli installed for the command above.

Once you have this public key, replace `CpYpw2Z6buf1vAGAmZPNz57pJadnrACJ1B3GJHNCSae8` with the new public key everywhere and build/test the contract again.

Finally, use the follwing command to deploy
```
solana program deploy ./target/deploy/mint_pool.so
```

## Creating a connection and a wallet

In order to talk to Solana and perform transactions, you need a connection and a wallet.

The following code creates a connection to devnet. Replace the url with your rpc server on mainnet for better performance.

```
 const connection = new web3.Connection(
    'https://api.devnet.solana.com', 
    'confirmed',
  );
```

Only the wallet added in `app.ts` can add new mint pools. The file contains the private key that can be used to initialize the in-memory wallet.


## Creating a Mint Pool

Make sure that you update authority public key inside `programs>mint-pool>src->states.rs` file! Otherwise you won't be able to mint.

```
await createMintPool(
    connection,   // As created above
    wallet,       // As created above
    'MyNFT',      // Name of the NFT
    'MN',         // Symbol of the NFT
    500,          // Royalty share on secondary sales
    'https://..'  // Link to off-chain metadata preferrably arweave but can be anything
    100,          // Max Supply of the NFT
    0.5 * web3.LAMPORTS_PER_SOL, // Price of each mint multiplied to correct format
    wallet.publicKey,            // Address where mint funds will be sent
    [
       new Creator({ address: 'DLTUbCJ5yR1sqox5fVP1RwhRQmr9w3az2APrjkoxt6f4', share: 100, verified: false }) // Creators array with share of royalties
    ]
);
```

## Getting All Mint Pools

```
await getAllMintPools(connection);
```

## Minting an NFT from the mint pool

```
await mint(connection, wallet, mintPool);
```

## Burning an NFT if you are the owner

```
await burn(
    connection,
    wallet, 
    mintPool.parsed.mint, // Mint id of the mint pool
    1                     // Number of nfts to be burnt
);
```

## Updating an NFT 

```
await update(
    connection,   // As created above
    wallet,       // As created above
    'MyNFT2',     // Name of the NFT
    'MN2',        // Symbol of the NFT
    400,          // Royalty share on secondary sales
    'https://..'  // Link to off-chain metadata preferrably arweave but can be anything
    [
       new Creator({ address: 'DLTUbCJ5yR1sqox5fVP1RwhRQmr9w3az2APrjkoxt6f4', share: 100, verified: false }) // Creators array with share of royalties
    ],
    mintPool.parsed.mint  // Mint id of the mint pool
);
```
