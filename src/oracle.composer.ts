import * as utils from "./oracle.utils";
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { OIS } from '@api3/ois';
import { createConfig } from './create-config';
import {v4 as uuidv4} from 'uuid';

const sponserMnemonic = "aisle genuine false door mouse sustain caught flock pyramid sister scan disease";
const sponsor = "0xdb2E1351c5De993629e703b51A730D7A6Ed24271"
const provider = "http://150.109.145.144:9101"
const airnoderrp = "0x82745827d0b8972ec0583b3100ecb30b81db0072";
const chainId = "1280";
const aidnodeAddress = "0x2156217a193B4bC6c3c24012611D124310663060";

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

export async function generateEndpointsFromApiSpec(o: any) {
    //    let a = ois.apiSpecifications.paths;
    //    a.
    //
    let paths = o['apiSpecifications']['paths'] as Map<string, any>;
    console.log(paths);
    let endpoints = [];
    paths.forEach((value: Map<string, any>, path: string) => {
        value.forEach((p: any, method: string) => {
            let parameters = p['parameters'] as [Map<string, any>];
            let a = [];
            parameters.forEach((element) => {
                a.push({
                    "name": element['name'],
                    "operationParameter": element,
                });
            });
            endpoints.push({
                name: 'asdf',
                operation: {
                    method: method,
                    path: path,
                },
                parameters: a,
            });
        })
    });
    console.log(endpoints);
    return endpoints;

}

export async function generateConfig(jobId: string, o: any) {
    let config = await createConfig(airnoderrp, chainId, [o])
    let ois = config.ois[0];
    let triggers = [];
    ois.endpoints.forEach( endpoint => {
        let id = utils.deriveEndpointId(ois.title,endpoint.name);
        triggers.push({
            endpointId: id,
            oisTitle: ois.title,
            endpointName: endpoint.name,
        });
    });
    console.log(triggers);
    config.triggers.http = triggers;
    config.triggers.rrp = triggers;
    console.log(config);

    writeFileSync(join('workspace', jobId, 'config', 'config.json'), JSON.stringify(config, null, 2) + '\n');
}

export async function generateSecrets(jobId: string, mnemonic: string) {
    let apiKey = uuidv4();
    writeFileSync(join('workspace', jobId, 'config', "secrets.env"), utils.formatSecrets([
        `AIRNODE_WALLET_MNEMONIC=${mnemonic}`,
        `PROVIDER_URL=${provider}`,
        `HTTP_GATEWAY_API_KEY=${apiKey}`,
    ]));
}

export async function deployAirnode(jobId: string) {
    let cmd = `cd workspace/${jobId} && docker run --rm \
    --env-file ../../aws.env \
    -e USER_ID=$(id -u) -e GROUP_ID=$(id -g) \
    -v "$(pwd)/config:/app/config" \
    -v "$(pwd)/output:/app/output" \
    api3/airnode-deployer:0.7.2 deploy`;
    console.log("deploy cmd:", cmd);
    execSync(cmd)
}