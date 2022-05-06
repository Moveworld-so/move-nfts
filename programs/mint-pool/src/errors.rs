use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    #[msg("Invalid pool authority")]
    InvalidAuthority,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid Token Account")]
    InvalidMintTokenAccount,
    #[msg("Not Enough Sol")]
    NotEnoughSOL,
    #[msg("Invalid Wallet")]
    InvalidWallet,
}