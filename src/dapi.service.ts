import { contracts } from '@api3/airnode-node/dist/src/evm';
import { OIS } from '@api3/ois';
import { Injectable, SerializeOptions } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { interval, map, Observable } from 'rxjs';
import * as composer from './oracle.composer';

enum JobStatus {
  PENDING, // 0%
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
  status: Map<string, JobStatus>;
  public constructor() {
    this.status = new Map();
  }

  fetch(jobId: string): Observable<MessageEvent> {
    console.log(this.status, jobId);
    console.log(this.status.get(jobId).toString());
    return interval(3000).pipe(map((_) => (
      { data: this.status.get(jobId).toString() } as MessageEvent )));
  }

  async acquire(requester: string) {
    let sponsor = await composer.sponsorRequester(requester);
    return { sponsor: sponsor, requester: requester };
  }

  async submit(ois: any, jobId: string) {
    this.status.set(jobId, JobStatus.PENDING);
    // TODO: save input to database

    workspace(jobId);
    console.log(ois);

    let requesterName = ois['title'].replace(/\s/g, '');
    console.log(requesterName);


    // GENERATING_AIRNODE_ADDRESS
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_ADDRESS);
    const [mnemonic, address] = await composer.generateAirnodeAddress();
    console.log('airnode info:', `mnemonic: ${mnemonic}`, `address: ${address}`);


    this.status.set(jobId, JobStatus.GENERATING_REQUESTER_CONTRACT);
    await composer.generateRequester(jobId, address, requesterName);

    // TODO: DEPLOYING_REQUESTER_CONTRACT
    this.status.set(jobId, JobStatus.DEPLOYING_REQUESTER_CONTRACT);
    let requester = await composer.deployRequester(jobId, requesterName);
    console.log(`Requester contract deployed, and requester address is ${requester}`);

    // SPONOR_REQUESTER_CONTRACT
    this.status.set(jobId, JobStatus.SPONSORING_REQUESTER_CONTRACT);
    await composer.sponsorRequester(requester.address);

    // GENERATE_AIRNODE_CONFIG
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_CONFIG);
    await composer.generateConfig(jobId, ois);

    // GENERATE_AIRNODE_SECRET
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_SECRET);
    await composer.generateSecrets(jobId, mnemonic);

    // DEPLOYING_AIRNODE_TO_AWS
    this.status.set(jobId, JobStatus.DEPLOYING_AIRNODE);

    // await composer.deployAirnode(jobId);

    this.status.set(jobId, JobStatus.DONE);
  }
}
