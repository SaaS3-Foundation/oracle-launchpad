import { Injectable } from '@nestjs/common';
import { UserRepository } from '../model/user/user.respository';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../model/user/user.entity';

@Injectable()
export class UserService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async findByAddress(address: string): Promise<UserEntity> {
    const users = await this.userRepository.findAll();
    return users.find(
      (user) =>
        user.walletInfo != null &&
        user.walletInfo.find((v) => v.address == address) != undefined,
    );
  }
}
