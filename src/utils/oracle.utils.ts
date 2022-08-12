import { ethers } from 'ethers';

export async function generateMnemonic() {
  const wallet = ethers.Wallet.createRandom();
  return wallet.mnemonic.phrase;
}

export async function derive(mnemonic: string) {
  return ethers.Wallet.fromMnemonic(mnemonic).address;
}

export const formatSecrets = (secrets: string[]) => secrets.join('\n') + '\n';

export function deriveEndpointId(oisTitle: string, endpointName: string) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['string', 'string'],
      [oisTitle, endpointName],
    ),
  );
}

export const getUserWallet = (mnemonic: string, url: string) => {
  const provider = new ethers.providers.JsonRpcProvider(url);
  return ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
};
