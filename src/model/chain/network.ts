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
    name: 'OKExChain Mainnet',
    type: ChainType.EVM,
    chainId: '66',
    httpProvider: 'https://exchainrpc.okex.org',
  },
  {
    name: 'Moonbase Alpha',
    type: ChainType.EVM,
    chainId: '1287',
    httpProvider: 'https://rpc.api.moonbase.moonbeam.network',
  },
  {
    type: ChainType.PHALA,
    name: 'Phala Testnet',
    chainId: 'Phala Testnet',
    wsProvider: 'wss://poc5.phala.network/ws',
    pruntime: 'https://poc5.phala.network/tee-api-1',
  },
  {
    type: ChainType.PHALA,
    name: 'Phala PreAlpha',
    chainId: 'Phala PreAlpha',
    clusterId:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    wsProvider: 'ws://localhost:19944',
    pruntime: 'http://localhost:18000',
  },
];
