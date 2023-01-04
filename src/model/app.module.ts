import { Module } from '@nestjs/common';
import { DapiService } from '../service/dapi.service';
import { DapiController } from '../controller/dapi/dapi.controller';
import { EventsGateway } from '../events.gateway';
import { ConfigModule } from '@nestjs/config';
import { DapiModule } from './dapi/dapi.module';
import { UserModule } from './user/user.module';
import { FaucetModule } from './faucet/faucet.module';
import envConfig from '../env';
import { UserController } from '../controller/user/user.controller';
import { UserService } from '../service/user.service';
import { OracleModule } from './oracle/oracle.module';
import { Web2InfoModule } from './web2Info/web2Info.module';
import { ChainModule } from './chain/chain.module';
import { DatabaseModule } from 'src/database/database.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    DatabaseModule,
    ChainModule,
    DapiModule,
    UserModule,
    FaucetModule,
    OracleModule,
    Web2InfoModule,
    WalletModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envConfig.path],
    }),
  ],
  controllers: [DapiController, UserController],
  providers: [DapiService, UserService, EventsGateway],
})
export class AppModule {}
