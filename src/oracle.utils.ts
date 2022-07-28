import { ethers } from 'ethers';

export async function generateMnemonic() {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic.phrase;
}

export async function derive(mnemonic: string) {
    return ethers.Wallet.fromMnemonic(mnemonic).address;
}