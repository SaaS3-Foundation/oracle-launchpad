import { Injectable, SerializeOptions } from '@nestjs/common';
import { UserRepository } from './model/user/user.respository';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UserEntity } from './model/user/user.entity';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class UserService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async register(user: UserEntity): Promise<UserEntity> {
    // do check
    return await this.userRepository.save(user);
  }
}
