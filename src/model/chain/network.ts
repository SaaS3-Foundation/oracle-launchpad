import { ChainType } from './types';

export const network = [
  {
    name: 'Ethereum',
    type: ChainType.EVM,
    chainId: '1',
    httpProvider: 'https://cloudflare-eth.com',
  },
  {
    name: 'BSC Mainnet',
    type: ChainType.EVM,
    chainId: '56',
    httpProvider: 'https://bsc.mytokenpocket.vip',
  },
  {
    type: ChainType.PHALA,
    name: 'Phala Mainnet',
    chainId: 'Phala Mainnet',
    wsProvider: 'wss://api.phala.network/ws',
  },
  {
    type: ChainType.PHALA,
    name: 'Phala Testnet',
    chainId: 'Phala Testnet',
    wsProvider: 'wss://pc-test-3.phala.network/khala/ws',
  },
];
