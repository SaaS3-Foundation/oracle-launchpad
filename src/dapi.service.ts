import { contracts } from '@api3/airnode-node/dist/src/evm';
import { OIS } from '@api3/ois';
import { Injectable, SerializeOptions } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { interval, map, Observable } from 'rxjs';
import { EventsGateway } from './events.gateway';
import { DapiRepository } from './model/dapi/dapi.respository';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { FaucetRepository } from './model/faucet/faucet.respository';
import * as phala from './phat.composer';
import { DapiEntity, OracleInfo } from './model/dapi/dapi.entity';
import { OracleRequest } from './model/Request';

enum JobStatus {
  PENDING = 0, // 0%
  DEPLOYING_SAAS3_PROTOCOL,
  SAAS3_PROTOCOL_DEPOLYED,
  DEPOLYING_SAAS3_DRUNTIME,
  ERROR,
  DONE, // 100%
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class DapiService {
  public constructor(
    private readonly ws: EventsGateway,
    private readonly dapiRepository: DapiRepository,
    private readonly configService: ConfigService,
    private readonly faucetRepository: FaucetRepository,
  ) {}

  async emit(jobId: string, s: JobStatus) {
    this.ws.server.emit('status', {
      jobId: jobId,
      status: JobStatus[s],
      progress: s * 10,
    });
    await this.dapiRepository.updateStatus(jobId, s);
  }

  status(n: number): string {
    return JobStatus[n];
  }

  async checkOpenapi(spec: any): Promise<any> {
    return { ok: true };
  }

  async submitV2(req: OracleRequest, jobId: string): Promise<any> {
    // compile and depoly anchor
    // TODO this is optional for future
    //let artifact = phala.loadAnchorArtifact();
    //await c_composer.deployWithWeb3(artifact.abi, artifact.bytecode);
    // compile and deploy dRuntime
    let entity = new DapiEntity(
      {
      id: jobId,
      oracleInfo: req.oracleInfo,
      creatorInfo: req.creatorInfo,
      status: JobStatus.PENDING,
      create_at: new Date(),
      update_at: new Date(),
      }
    );
    this.dapiRepository.save(entity);
    return;
    const sponsorMnemonic =
      'aisle genuine false door mouse sustain caught flock pyramid sister scan disease';
    await phala.deploydRuntime(
      sponsorMnemonic,
      this.configService.get('CLUSTER_ID'),
      this.configService.get('CHAIN'),
      this.configService.get('PRUNTIME'),
      '/Users/songtianyi/workhub/github/phat-stateful-rollup/phat/artifacts/sample_oracle/sample_oracle.contract',
      {},
    );
  }
}
