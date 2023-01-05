import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../model/user/user.respository';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../model/user/user.entity';
import { DataSource } from 'typeorm';
import { WalletRepository } from 'src/model/wallet/wallet.respository';
import { nanoid } from 'nanoid';
import { ChainRepository } from 'src/model/chain/chain.respository';
import { WalletEntity } from 'src/model/wallet/wallet.entity';

@Injectable()
export class UserService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly chainRepository: ChainRepository,
    private readonly configService: ConfigService,
    @Inject('PG_SOURCE')
    readonly dataSource: DataSource,
  ) {}

  saveUser(user: UserEntity) {
    return this.dataSource.transaction(async (manager) => {
      await manager.insert(UserEntity, user);

      const promiseAll = [];
      for (const wallet of user.wallets) {
        if (!wallet.chain.chainId) continue;

        if (!wallet.id) {
          promiseAll.push(
            manager.insert(WalletEntity, {
              ...wallet,
              id: nanoid(),
              user,
            } as WalletEntity),
          );
        }
      }
      await Promise.all(promiseAll);
    });
  }
}
