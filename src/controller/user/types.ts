import { ChainEntity } from 'src/model/chain/chain.entity';

export class WalletRequest {
  address: string;
  signature: string;
  nonce: string;
  chain: ChainEntity;
}
