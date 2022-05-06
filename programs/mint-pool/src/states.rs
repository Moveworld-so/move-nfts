use anchor_lang::prelude::*;
use std::str::FromStr;

pub const MINT_POOL_PREFIX: &str = "mint-pool";

pub const MINT_POOL_SIZE: usize = 8 + std::mem::size_of::<MintPool>() + 8;
#[account]
pub struct MintPool {
    pub bump: u8,
    pub name: String,
    pub mint: Pubkey,
    pub max_supply: u64,
    pub price: u64,
    pub wallet: Pubkey,
    pub rewards_issued: u64
}

pub fn is_authority(key: &Pubkey) -> bool{
    let authorities = [
        // Test
        Pubkey::from_str("DLTUbCJ5yR1sqox5fVP1RwhRQmr9w3az2APrjkoxt6f4").unwrap()
    ];
    return authorities.contains(key)
}