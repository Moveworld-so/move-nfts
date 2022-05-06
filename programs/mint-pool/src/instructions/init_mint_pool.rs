use {
    crate::{states::*, errors::*},
    anchor_lang::{prelude::*,
}};

use spl_token::instruction::AuthorityType;

use anchor_spl::{
    token::{self, Token, Mint, SetAuthority},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitMintPoolIx {
    pub bump: u8,
    pub name: String,
    pub mint: Pubkey,
    pub max_supply: u64,
    pub price: u64,
    pub wallet: Pubkey,
}

#[derive(Accounts)]
#[instruction(ix: InitMintPoolIx)]
pub struct InitMintPoolCtx<'info>{
    #[account(
        init,
        payer = payer,
        space = MINT_POOL_SIZE,
        seeds = [MINT_POOL_PREFIX.as_bytes(), ix.mint.as_ref()],
        bump = ix.bump,
    )]
    mint_pool: Account<'info, MintPool>,

    #[account(mut, constraint = mint.freeze_authority.unwrap() == mint_authority.key() @ ErrorCode::InvalidMintAuthority)]
    mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    mint_authority: Signer<'info>,

    // programs
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,

    rent: Sysvar<'info, Rent>,
    #[account(constraint = is_authority(&payer.key()) @ ErrorCode::InvalidAuthority)]
    payer: Signer<'info>,
}

pub fn handler(ctx: Context<InitMintPoolCtx>, ix: InitMintPoolIx) -> ProgramResult {
    let mint_pool = &mut ctx.accounts.mint_pool;
    mint_pool.name = ix.name;
    mint_pool.mint = ix.mint;
    mint_pool.max_supply = ix.max_supply;
    mint_pool.price = ix.price;
    mint_pool.wallet = ix.wallet;
    mint_pool.rewards_issued = 0;
    mint_pool.bump = ix.bump;

    // Transfer authority to nft pool
    let cpi_accounts = SetAuthority {
        account_or_mint: ctx.accounts.mint.to_account_info(),
        current_authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::set_authority(cpi_context, AuthorityType::MintTokens, Some(ctx.accounts.mint_pool.key()))?;
    
    return Ok(());
}