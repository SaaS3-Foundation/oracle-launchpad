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
    name: 'Moonbase Alpha',
    type: ChainType.EVM,
    chainId: '1287',
    httpProvider: 'https://bsc.mytokenpocket.vip',
  },
  {
    type: ChainType.PHALA,
    name: 'Phala Testnet',
    chainId: 'Phala Testnet',
    wsProvider: 'wss://poc5.phala.network/ws',
    pruntime: 'https://poc5.phala.network/tee-api-1',
  },
];
