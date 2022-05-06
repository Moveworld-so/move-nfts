import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import { Program } from '@project-serum/anchor';
import { SignerWallet } from "@saberhq/solana-contrib";
import { MintPool } from '../target/types/mint_pool';
import { createMint } from "./utils";
import { withInitMintPool, findMintPoolId } from "../js/index";
import assert from "assert";

describe('mint-pool', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const mintPool = anchor.workspace.MintPool as Program<MintPool>;
  let mint: splToken.Token = null;
  let mintPoolAuthorityWallet: SignerWallet = null;
  let feeWallet = web3.Keypair.generate();

  const AUTHORITY_SECRET_KEY = JSON.parse(process.env.AUTHORITY_SECRET_KEY);
  const MINT_POOL_AUHTORITY_FROM_SECRET_KEY = new Uint8Array(AUTHORITY_SECRET_KEY);
  let mintPoolAuthority = web3.Keypair.fromSecretKey(
    MINT_POOL_AUHTORITY_FROM_SECRET_KEY
  );

  before(async () => {
    mintPoolAuthorityWallet = new SignerWallet(mintPoolAuthority);
    var fromAirdropSignature = await provider.connection.requestAirdrop(
      mintPoolAuthorityWallet.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fromAirdropSignature);
  });

  it("Initialize mint pool", async () => {
    const poolName = "mint-demo";
    const maxSupply = 1;
    const price = 0.5 * web3.LAMPORTS_PER_SOL;

    const transaction = new web3.Transaction();

    const mintAuthority = web3.Keypair.generate();
    [, mint] = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey
    );

    await withInitMintPool(
      provider.connection,
      mintPoolAuthorityWallet,
      transaction,
      {
        poolName: poolName,
        mint: mint.publicKey,
        mintAuthority: mintAuthority.publicKey,
        maxSupply: maxSupply,
        price: new anchor.BN(price),
        feeWallet: feeWallet.publicKey
      }
    );

    transaction.feePayer = mintPoolAuthorityWallet.publicKey;
    transaction.recentBlockhash = (
      await provider.connection.getLatestBlockhash("max")
    ).blockhash;

    await mintPoolAuthorityWallet.signTransaction(transaction);
    await transaction.partialSign(mintAuthority);
    await web3.sendAndConfirmRawTransaction(
      provider.connection,
      transaction.serialize()
    );

    const [mintPoolId] = await findMintPoolId(mint.publicKey);

    const checkMintPool = await mintPool.account.mintPool.fetch(mintPoolId);

    assert.equal(
      checkMintPool.mint.toString(),
      mint.publicKey.toString()
    );

    assert.equal(checkMintPool.name, poolName);

    assert.equal(checkMintPool.maxSupply, maxSupply);

    const fetchMint = new splToken.Token(
      provider.connection,
      mint.publicKey,
      splToken.TOKEN_PROGRAM_ID,
      null
    );
    let fetchMintInfo = await fetchMint.getMintInfo();
    assert.notEqual(fetchMintInfo, null);
    assert.equal(
      fetchMintInfo.mintAuthority.toString(),
      mintPoolId.toString()
    );
    assert.equal(
      fetchMintInfo.freezeAuthority.toString(),
      mintAuthority.publicKey.toString()
    );
  });
});
