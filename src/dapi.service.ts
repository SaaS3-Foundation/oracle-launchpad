import { contracts } from '@api3/airnode-node/dist/src/evm';
import { OIS } from '@api3/ois';
import { Injectable, SerializeOptions } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { interval, map, Observable } from 'rxjs';
import { EventsGateway } from './events.gateway';
import * as composer from './oracle.composer';
import { DapiRepository } from './model/dapi/dapi.respository';
import { createDemoContract } from './utils/create-contract';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { FaucetRepository } from './model/faucet/faucet.respository';

enum JobStatus {
  PENDING = 0, // 0%
  GENERATING_DAPI_ADDRESS,
  GENERATING_DAPI_CONFIG,
  GENERATING_DAPI_SECRET,
  GENERATING_DAPI_CONTRACT,
  DEPLOYING_DAPI_CONTRACT,
  SPONSORING_DAPI_CONTRACT,
  DEPLOYING_DAPI,
  ERROR,
  DONE, // 100%
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function workspace(dir: string) {
  let cfg = 'workspace/' + dir + '/config';
  if (!existsSync(cfg)) {
    mkdirSync(cfg, {
      recursive: true,
    });
  }

  let c = 'workspace/' + dir + '/contracts';
  if (!existsSync(c)) {
    mkdirSync(c, {
      recursive: true,
    });
  }
}

@Injectable()
export class DapiService {
  public constructor(
    private readonly ws: EventsGateway,
    private readonly dapiRepository: DapiRepository,
    private readonly configService: ConfigService,
    private readonly faucetRepository: FaucetRepository,
  ) { }

  emit(jobId: string, s: JobStatus) {
    this.ws.server.emit('status', {
      jobId: jobId,
      status: JobStatus[s],
      progress: s * 10,
    });
    this.dapiRepository.updateStatus(jobId, s);
  }

  status(n: number): string {
    return JobStatus[n];
  }

  async acquire(requester: string) {
    let sponsor = await composer.sponsorRequester(requester);
    return { sponsor: sponsor, requester: requester };
  }

  async check(ois: any, addr: string): Promise<any> {
    if (ois['title'] == undefined || ois['title'] == '') {
      return { ok: false, err: 'title is required' };
    }
    if (ois['creator'] == undefined || ois['creator'].length == 0) {
      return { ok: false, err: 'creator is required' };
    }
    if (ois['description'] == undefined || ois['description'] == '') {
      return { ok: false, err: 'description is required' };
    }
    if (addr == undefined || addr == '') {
      return { ok: false, err: 'address is required' };
    }
    let r = await this.faucetRepository.findOneBy(addr);
    if (r == null || r === undefined) {
      return {
        ok: false,
        err: 'Insufficient gas fee, please go to https://www.saas3.io/faucet get token first!',
      };
    }
    return { ok: true };
  }

  async submit(ois: any, jobId: string, creatorAddress: string) {
    this.emit(jobId, JobStatus.PENDING);

    console.log('================', jobId, '================');
    let entity = {
      id: jobId,
      title: ois['title'],
      creator: ois['creator'],
      creatorAddress: creatorAddress,
      description: ois['description'],
      status: JobStatus.PENDING,
      tags: ois['tags'],
      demo: null,
      demoAbi: null,
      demoAddress: null,
      requester: null,
      requesterAbi: null,
      requesterAddress: null,
      triggers: null,
      create_at: new Date(),
      update_at: new Date(),
    };
    this.dapiRepository.save(entity);

    delete ois['creator'];
    delete ois['description'];
    delete ois['tags'];
    delete ois['address'];

    workspace(jobId);
    console.log(ois);

    let requesterName = ois['title'].replace(/\s/g, '');
    console.log('RequseterName', requesterName);

    // GENERATING_DAPI_ADDRESS
    this.emit(jobId, JobStatus.GENERATING_DAPI_ADDRESS);
    // const [mnemonic, address] = await composer.generateDapiAddress();
    const [mnemonic, address] = [
      'taxi balance fine alert urban trip forum student question job hazard devote',
      '0x2156217a193B4bC6c3c24012611D124310663060',
    ];
    console.log('DAPI mnemonic:', mnemonic);
    console.log('DAPI address:', address);

    // GENERATE_DAPI_CONFIG
    let apiKey = '';
    if (
      Object.entries(ois['apiSpecifications']['components']['securitySchemes'])
        .length > 0
    ) {
      apiKey =
        ois['apiSpecifications']['components']['securitySchemes']['1']['value'];
      delete ois['apiSpecifications']['components']['securitySchemes']['1'][
        'value'
      ];
    }
    this.emit(jobId, JobStatus.GENERATING_DAPI_CONFIG);
    console.log(this.configService.get('LOCAL'));
    let config = await composer.generateConfig(
      jobId,
      ois,
      this.configService.get('LOCAL'),
    );
    entity.triggers = JSON.stringify(config.triggers);

    // GENERATE_AIRNODE_SECRET
    this.emit(jobId, JobStatus.GENERATING_DAPI_SECRET);
    await composer.generateSecrets(jobId, mnemonic, apiKey);

    this.emit(jobId, JobStatus.GENERATING_DAPI_CONTRACT);
    let requesterContract = await composer.generateRequester(
      jobId,
      address,
      requesterName,
    );
    entity.requester = requesterContract;
    this.dapiRepository.update(entity);

    if (this.configService.get('NO_DEPLOY_AND_SPONSOR') === 'true') {
      this.emit(jobId, JobStatus.DONE);
      console.log('================', 'END', '================');
      return;
    }

    // DEPLOYING_REQUESTER_CONTRACT
    this.emit(jobId, JobStatus.DEPLOYING_DAPI_CONTRACT);
    let requester = { address: '', abi: {} };
    try {
      requester = await composer.deployRequester(jobId, requesterName);
      console.log(`Requester contract deployed, and requester is ${requester}`);
      entity.requesterAddress = requester.address;
      entity.requesterAbi = requester.abi;
    } catch (e) {
      console.log(e);
      this.emit(jobId, JobStatus.ERROR);
      return;
    }

    // genreate demo contract
    entity.demo = await createDemoContract(
      jobId,
      requesterName,
      requester.address,
    );
    console.log('demo contract\n', entity.demo);
    this.dapiRepository.update(entity);

    // SPONOR_REQUESTER_CONTRACT
    if (this.configService.get('NO_SPONSOR') === 'false') {
      this.emit(jobId, JobStatus.SPONSORING_DAPI_CONTRACT);
      try {
        await composer.sponsorRequester(requester.address);
      } catch (e) {
        console.log(e);
        this.emit(jobId, JobStatus.ERROR);
        return;
      }
    }

    // DEPLOYING_AIRNODE_TO_AWS
    if (this.configService.get('NO_DEPLOY_API') === 'false') {
      this.emit(jobId, JobStatus.DEPLOYING_DAPI);

      if (this.configService.get('LOCAL')) {
        await composer.deployDapiLocal(jobId);
      } else {
        await composer.deployDapi(jobId);
      }
    }

    this.emit(jobId, JobStatus.DONE);
    console.log('================', 'END', '================');
  }

  async calltest(str: string) {
    await composer.calltest(str);
  }
}
