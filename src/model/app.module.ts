import { Module } from '@nestjs/common';
import { DapiService } from '../service/dapi.service';
import { DapiController } from '../controller/dapi.controller';
import { EventsGateway } from '../events.gateway';
import { ConfigModule } from '@nestjs/config';
import { DapiModule } from './dapi/dapi.module';
import { UserModule } from './user/user.module';
import { FaucetModule } from './faucet/faucet.module';
import envConfig from '../env';
import { UserController } from '../controller/user.controller';
import { UserService } from '../service/user.service';

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
