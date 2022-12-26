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

  register(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.save(user);
  }
}
