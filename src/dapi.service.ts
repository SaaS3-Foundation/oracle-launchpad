import { OIS } from '@api3/ois';
import { Injectable, SerializeOptions } from '@nestjs/common';
import { time } from 'console';
import { takeWhile } from 'rxjs';
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
    return new Promise( resolve => setTimeout(resolve, ms) );
}

@Injectable()
export class DapiService {
  status: Map<string, JobStatus>;
  public constructor() {
    this.status = new Map();
  }
  async submit(ois: OIS, jobId: string) {
    this.status.set(jobId, JobStatus.PENDING);
    // TODO: save input to database

    // GENERATING_AIRNODE_ADDRESS
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_ADDRESS);
    const [mnemonic, address] = await composer.generateAirnodeAddress();
    console.log('airnode info:', `mnemonic: ${mnemonic}`, `address: ${address}`);


    // GENERATING_REQUESTER_CONTRACT
    this.status.set(jobId, JobStatus.GENERATING_REQUESTER_CONTRACT);
    await delay(3000);

    // DEPLOYING_REQUESTER_CONTRACT
    this.status.set(jobId, JobStatus.DEPLOYING_REQUESTER_CONTRACT);
    await delay(3000);

    // SPONOR_REQUESTER_CONTRACT
    this.status.set(jobId, JobStatus.SPONSORING_REQUESTER_CONTRACT);
    await delay(3000);

    // GENERATE_AIRNODE_CONFIG
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_CONFIG);
    await delay(3000);

    // GENERATE_AIRNODE_SECRET
    this.status.set(jobId, JobStatus.GENERATING_AIRNODE_SECRET);
    await delay(3000);

    // DEPLOYING_AIRNODE_TO_AWS
    this.status.set(jobId, JobStatus.DEPLOYING_AIRNODE);
    await delay(3000);

    this.status.set(jobId, JobStatus.DONE);
  }
}
