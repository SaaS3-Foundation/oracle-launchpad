import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events.gateway';
import { DapiRepository } from '../model/dapi/dapi.respository';
import { ConfigService } from '@nestjs/config';
import { FaucetRepository } from '../model/faucet/faucet.respository';
import * as phala from '../phat.composer';
import { ChainType, DapiEntity, JobStatus } from '../model/dapi/dapi.entity';
import { OracleRequest } from '../model/Request';

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

  async submitV2(_entity: DapiEntity): Promise<any> {
    const sponsorMnemonic = this.configService.get('SPONSOR_MNEMONIC');
    if (_entity.oracleInfo.targetChain.type == ChainType.EVM) {
      const artifact = phala.loadAnchorArtifact(
        this.configService.get('PHALA_ANCHOR_PATH'),
      );
      await phala.deployWithWeb3(
        _entity.oracleInfo.targetChain.httpProvider,
        sponsorMnemonic,
        artifact.abi,
        artifact.bytecode,
      );
      // await phala.configAnchor();
    }
    await this.dapiRepository.save(_entity);
    if (_entity.oracleInfo.sourceChain.type == ChainType.PHALA) {
      this.dapiRepository.updateStatus(
        _entity.id,
        JobStatus.DEPOLYING_SAAS3_DRUNTIME,
      );
      _entity.oracleInfo.address = await phala.deployFatContract(
        sponsorMnemonic,
        _entity.oracleInfo.sourceChain.clusterId,
        _entity.oracleInfo.sourceChain.wsProvider,
        _entity.oracleInfo.sourceChain.pruntime,
        this.configService.get('DRUNTIME_FAT_PATH'),
        {
          target_chain_rpc: _entity.oracleInfo.targetChain.httpProvider,
          anchor_contract_addr: 'TODO',
          web2_api_url_prefix: _entity.oracleInfo.web2Info.uri,
          api_key: '',
        },
      );
      _entity.status = JobStatus.DONE;
      await this.dapiRepository.update(_entity);
    }
  }
}
