import { Module } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { DapiController } from './dapi.controller';
import { EventsGateway } from './events.gateway';
import { ConfigModule } from '@nestjs/config';
import { DapiModule } from './model/dapi/dapi.module';
import { UserModule } from './model/user/user.module';
import { FaucetModule } from './model/faucet/faucet.module';
import envConfig from './env';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    DapiModule,
    UserModule,
    FaucetModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envConfig.path],
    }),
  ],
  controllers: [DapiController, UserController],
  providers: [DapiService, UserService, EventsGateway],
})
export class AppModule {}
