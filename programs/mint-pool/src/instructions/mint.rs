use {
    crate::{states::*, errors::*},
    anchor_lang::{
        prelude::*,
        solana_program::{
            program::{invoke},
            system_instruction,
        }
    }
};

use anchor_spl::{
    token::{ self, Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct MintCtx<'info>{
    #[account(mut)]
    mint_pool: Box<Account<'info, MintPool>>,
    #[account(mut)]
    user: Signer<'info>,

    #[account(mut, constraint = mint.key() == mint_pool.mint @ ErrorCode::InvalidMint)]
    mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint = wallet.key() == mint_pool.wallet @ ErrorCode::InvalidWallet)]
    wallet: AccountInfo<'info>,

    #[account(mut, constraint = mint_token_account.owner == user.key()
        @ ErrorCode::InvalidMintTokenAccount)]
    mint_token_account: Box<Account<'info, TokenAccount>>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<MintCtx>) -> ProgramResult {
    let mint_pool = &mut ctx.accounts.mint_pool;
    let mint_pool_seed = &[MINT_POOL_PREFIX.as_bytes(), mint_pool.mint.as_ref(), &[mint_pool.bump]];
    let mint_pool_signer = &[&mint_pool_seed[..]];

    if mint_pool.rewards_issued < mint_pool.max_supply {
        let price = mint_pool.price;
        let wallet = &mut ctx.accounts.wallet;

        if ctx.accounts.user.lamports() < price {
            return Err(ErrorCode::NotEnoughSOL.into());
        }

        invoke(
            &system_instruction::transfer(&ctx.accounts.user.key(), &wallet.key(), price),
            &[
                ctx.accounts.user.to_account_info(),
                wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.mint_token_account.to_account_info(),
            authority: mint_pool.to_account_info()
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(mint_pool_signer);
        token::mint_to(cpi_context, 1)?;

        mint_pool.rewards_issued = mint_pool.rewards_issued + 1;
    }

    Ok(())
}