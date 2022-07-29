import * as utils from "./oracle.utils";
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { OIS } from '@api3/ois';

const sponserMnemonic = "aisle genuine false door mouse sustain caught flock pyramid sister scan disease";
const sponsor = "0xdb2E1351c5De993629e703b51A730D7A6Ed24271"
const provider = "http://150.109.145.144:9101"
const airnoderrp = "0x82745827d0b8972ec0583b3100ecb30b81db0072";

export async function generateAirnodeAddress() {
    let mne = await utils.generateMnemonic();
    let addr = await utils.derive(mne);
    return [mne, addr] as const;
}

export async function sponsorRequester(requester: string) {
    let cmd = `npx @api3/airnode-admin sponsor-requester \
     --provider-url ${provider} \
     --airnode-rrp-address ${airnoderrp} \
     --sponsor-mnemonic ${sponserMnemonic}
     --requester-address ${requester}`;
     console.log("sposor cmd:", cmd);
    execSync(cmd)
    return sponsor;
}

export async function generateEndpointsFromApiSpec(ois: OIS) {
//    let a = ois.apiSpecifications.paths;
//    a.
//
}

export async function generateSecrets(jobId: string, mnemonic: string) {
    writeFileSync(join(jobId, "secrets.env"), utils.formatSecrets([
        `AIRNODE_WALLET_MNEMONIC=${mnemonic}`,
        `PROVIDER_URL=${provider}`,
      ]));
}