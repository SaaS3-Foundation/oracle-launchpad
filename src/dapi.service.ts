import { contracts } from '@api3/airnode-node/dist/src/evm';
import { OIS } from '@api3/ois';
import { Injectable, SerializeOptions } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { interval, map, Observable } from 'rxjs';
import { EventsGateway } from './events.gateway';
import * as composer from './oracle.composer';
import { DapiRepository } from './model/dapi/dapi.respository';
import { createDemoContract } from './utils/create-contract';

enum JobStatus {
  PENDING = 0, // 0%
  GENERATING_REQUESTER_CONTRACT, // 30s, 0-4%
  DEPLOYING_REQUESTER_CONTRACT, // 2min, 4-20%
  GENERATING_AIRNODE_ADDRESS, // 30s, 20 - 24%
  SPONSORING_REQUESTER_CONTRACT, // 30s, 24 - 28%
  GENERATING_AIRNODE_CONFIG, // 30s, 28 - 32%
  GENERATING_AIRNODE_SECRET, // 30s, 32 - 26%
  DEPLOYING_AIRNODE, // 36 - 99%, 10 min
  ERROR,
  DONE, // 100%
}


function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function workspace(dir: string) {
  let cfg = 'workspace/' + dir + '/config';
  if (!existsSync(cfg)) {
    mkdirSync(cfg, {
      recursive: true
    });
  }

  let c = 'workspace/' + dir + '/contracts';
  if (!existsSync(c)) {
    mkdirSync(c, {
      recursive: true
    });
  }
}

@Injectable()
export class DapiService {
  public constructor(private readonly ws: EventsGateway,
    private readonly dapiRepository: DapiRepository) {
  }


  emit(jobId: string, s: JobStatus) {
    this.ws.server.emit('status', { jobId: jobId, status: JobStatus[s], progress: s * 10 });
  }

  async acquire(requester: string) {
    let sponsor = await composer.sponsorRequester(requester);
    return { sponsor: sponsor, requester: requester };
  }

  check(ois: any): boolean {
    if (ois['title'] == undefined || ois['title'] == '') {
      return false;
    }
    if (ois['creator'] == undefined || ois['creator'].length == 0) {
      return false;
    }
    if (ois['description'] == undefined || ois['description'] == '') {
      return false;
    }
    return true;
  }

  async submit(ois: any, jobId: string) {
    this.emit(jobId, JobStatus.PENDING);

    console.log("================", jobId, "================");
    let entity = {
      id: jobId,
      title: ois['title'],
      creator: ois['creator'],
      description: ois['description'],
      status: JobStatus.PENDING,
      tags: ois['tags'],
      demo: null,
      requester: null,
      triggers: null,
      create_at: new Date(),
      update_at: new Date(),
    };
    workspace(jobId);
    console.log(ois);

    let requesterName = ois['title'].replace(/\s/g, '');
    console.log('RequseterName', requesterName);


    // GENERATING_AIRNODE_ADDRESS
    this.emit(jobId, JobStatus.GENERATING_AIRNODE_ADDRESS);
    // const [mnemonic, address] = await composer.generateAirnodeAddress();
    const [mnemonic, address] = ["taxi balance fine alert urban trip forum student question job hazard devote", "0x2156217a193B4bC6c3c24012611D124310663060"];
    console.log('Airnode mnemonic:', mnemonic);
    console.log('Airnode address:', address);

    // GENERATE_AIRNODE_CONFIG
    this.emit(jobId, JobStatus.GENERATING_AIRNODE_CONFIG)
    let config = await composer.generateConfig(jobId, ois);
    entity.triggers = JSON.stringify(config.triggers);

    // GENERATE_AIRNODE_SECRET
    this.emit(jobId, JobStatus.GENERATING_AIRNODE_SECRET);
    await composer.generateSecrets(jobId, mnemonic);

    this.emit(jobId, JobStatus.GENERATING_REQUESTER_CONTRACT);
    let requesterContract = await composer.generateRequester(jobId, address, requesterName);
    entity.requester = requesterContract;

    // DEPLOYING_REQUESTER_CONTRACT
    this.emit(jobId, JobStatus.DEPLOYING_REQUESTER_CONTRACT);
    let requester = await composer.deployRequester(jobId, requesterName);
    console.log(`Requester contract deployed, and requester is ${requester}`);

    // genreate demo contract
    entity.demo = await createDemoContract(jobId, requesterName, requester.address);

    // SPONOR_REQUESTER_CONTRACT
    //this.emit(jobId, JobStatus.SPONSORING_REQUESTER_CONTRACT);
    //await composer.sponsorRequester(requester.address);

    // DEPLOYING_AIRNODE_TO_AWS
    this.emit(jobId, JobStatus.DEPLOYING_AIRNODE)

    //await composer.deployAirnode(jobId);

    this.emit(jobId, JobStatus.DONE);
    entity.update_at = new Date();
    entity.status = JobStatus.DONE;
    this.dapiRepository.save(entity);
    console.log("================", 'END', "================");
  }
}
