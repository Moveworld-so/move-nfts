mod instructions;
pub mod states;
pub mod errors;

use instructions::*;
use anchor_lang::prelude::*;

declare_id!("CpYpw2Z6buf1vAGAmZPNz57pJadnrACJ1B3GJHNCSae8");

#[program]
pub mod mint_pool {
    use super::*;

    pub fn init_mint_pool(ctx: Context<InitMintPoolCtx>, ix: InitMintPoolIx) -> ProgramResult {
        init_mint_pool::handler(ctx, ix)
    }

    pub fn mint(ctx: Context<MintCtx>) -> ProgramResult {
        mint::handler(ctx)
    }
}