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
import {
  ChainType,
  DapiEntity,
  JobStatus,
  OracleInfo,
} from './model/dapi/dapi.entity';
import { OracleRequest } from './model/Request';

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
    let entity = new DapiEntity({
      id: jobId,
      oracleInfo: req.oracleInfo,
      creatorInfo: req.creatorInfo,
      status: JobStatus.PENDING,
      create_at: new Date(),
      update_at: new Date(),
    });
    entity = await this.dapiRepository.save(entity);
    let sponsorMnemonic = this.configService.get('SPONSOR_MNEMONIC');
    if (entity.oracleInfo.sourceChain.type == ChainType.PHALA) {
      this.dapiRepository.updateStatus(
        entity.id,
        JobStatus.DEPOLYING_SAAS3_DRUNTIME,
      );
      entity.oracleInfo.address = await phala.deploydRuntime(
        sponsorMnemonic,
        entity.oracleInfo.sourceChain.clusterId,
        entity.oracleInfo.sourceChain.wsProvider,
        entity.oracleInfo.sourceChain.pruntime,
        this.configService.get('DRUNTIME_FAT_PATH'),
        {
          target_chain_rpc: entity.oracleInfo.targetChain.httpProvider,
          anchor_contract_addr: 'TODO',
          web2_api_url_prefix: entity.oracleInfo.web2Info.uri,
          api_key: '',
        },
      );
      entity.status = JobStatus.DONE;
      this.dapiRepository.update(entity);
    }
  }
}
