import * as utils from './utils/oracle.utils';
import { execSync } from 'child_process';
import { writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { OIS } from '@api3/ois';
import { createConfigAws, createConfigLocal } from './utils/create-config';
import { createHardhatConfig, createRequester } from './utils/create-contract';
import { v4 as uuidv4 } from 'uuid';
import Web3 from 'web3';
import { random } from 'nanoid';
import * as composer from './common.composer';

const sponsorMnemonic =
  'aisle genuine false door mouse sustain caught flock pyramid sister scan disease';
const sponsor = '0x944e24Ded49747c8278e3D3b4148da68e5B6672C';
const sponsorWallet = '0xdb2E1351c5De993629e703b51A730D7A6Ed24271';
// saas3
// const provider = 'http://150.109.145.144:9101';
// const airnodeRrp = '0x920ddc804c258b009ea1e7b9dacf8006805a15a8';
// const chainId = '1280';
// const network = 'saas3-testnet';

// moonbeam alpha
const airnodeRrp = '0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd';
const provider = 'https://rpc.api.moonbase.moonbeam.network';
const chainId = '1287';
const network = 'Moonbase Alpha';

// Rinkeby
// const airnodeRrp = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd"
// const provider = "https://rinkeby.infura.io/v3/";
// const chainId = "4";
// const network = "Rinkeby";

export async function generateDapiAddress() {
  let mne = await utils.generateMnemonic();
  let addr = await utils.derive(mne);
  return [mne, addr] as const;
}

export async function sponsorRequester(requester: string) {
  let cmd = `npx @api3/airnode-admin@0.7.2 sponsor-requester \
     --provider-url ${provider} \
     --airnode-rrp-address ${airnodeRrp} \
     --sponsor-mnemonic "${sponsorMnemonic}" \
     --requester-address ${requester}`;
  console.log('Sponsoring cmd:\n', cmd);
  execSync(cmd);
}

export async function generateEndpointsFromApiSpec(o: any) {
  let paths = o['apiSpecifications']['paths'] as Map<string, any>;
  console.log(paths);
  let endpoints = [];
  paths.forEach((value: Map<string, any>, path: string) => {
    value.forEach((p: any, method: string) => {
      let parameters = p['parameters'] as [Map<string, any>];
      let a = [];
      parameters.forEach((element) => {
        a.push({
          name: element['name'],
          operationParameter: element,
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
    });
  });
  console.log(endpoints);
  return endpoints;
}

export async function generateRequester(
  jobId: string,
  airnodeAddress: string,
  requesterName: string,
) {
  // generate contract
  let requesterContract = await createRequester(
    airnodeAddress,
    sponsor,
    sponsorWallet,
    requesterName,
  );
  writeFileSync(
    join('workspace/evm', jobId, `contracts/${requesterName}.sol`),
    requesterContract,
  );
  console.log(requesterContract);

  // generate hardhat config
  let hardhatCfg = await createHardhatConfig(
    network,
    provider,
    sponsorMnemonic,
  );
  console.log(hardhatCfg);
  writeFileSync(join('workspace/evm', jobId, `hardhat.config.ts`), hardhatCfg);

  // compile
  let cmd = `cd workspace/evm/${jobId} && npx hardhat compile`;
  console.log(cmd);
  execSync(cmd);
  return requesterContract;
}

export async function calltest(str: string) {
  const addr = '0x44771f41a433fef30147fbe544f84e9dcc4baa88';
  const web3 = new Web3(provider);
  const abi = [
    {
      inputs: [
        {
          internalType: 'string',
          name: 'newName',
          type: 'string',
        },
      ],
      name: 'setName',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getName',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const nameConctract = new web3.eth.Contract(abi as any, addr);
  console.log('call test');
  console.log(await nameConctract.methods['getName']().call());
  // for mapping vars
  // nameContract.methods.incomingFulfillments('key').call();

  let prikey = utils.getUserWallet(sponsorMnemonic, provider).privateKey;
  let signer = web3.eth.accounts.privateKeyToAccount(prikey);
  web3.eth.accounts.wallet.add(signer);

  await nameConctract.methods
    .setName(...[str])
    .send({ from: signer.address, gas: 1000000 });

  console.log(await nameConctract.methods.getName().call());
}

export const deployRequester = async (jobId: string, requesterName: string) => {
  const artifact = getArtifact(jobId, requesterName);

  console.log('Deploying contract', requesterName, '...');

  return composer.deployWithWeb3(artifact.abi, artifact.bytecode);
};

const getArtifact = (jodId: string, requesterName: string) => {
  const artifactPath = join(
    __dirname,
    '../workspace/evm',
    jodId,
    'artifacts/contracts',
    requesterName + '.sol',
    requesterName + '.json',
  );
  return require(artifactPath);
};

export async function generateConfig(jobId: string, o: any, isLocal: string) {
  let config = await createConfigAws(airnodeRrp, chainId, [o]);
  if (isLocal === 'true') {
    config = await createConfigLocal(airnodeRrp, chainId, [o]);
  }
  console.log(config);
  let ois = config.ois[0];
  // generate triggers
  let triggers = [];
  ois.endpoints.forEach((endpoint) => {
    let id = utils.deriveEndpointId(ois.title, endpoint.name);
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

  if (
    Object.entries(o['apiSpecifications']['components']['securitySchemes'])
      .length > 0
  ) {
    config.apiCredentials.push({
      oisTitle: ois.title,
      securitySchemeName: '1',
      securitySchemeValue: '${API_KEY}',
    });
  }

  writeFileSync(
    join('workspace/evm', jobId, 'config', 'config.json'),
    JSON.stringify(config, null, 2) + '\n',
  );
  return config;
}

export async function generateSecrets(
  jobId: string,
  mnemonic: string,
  apiKey: string = '',
) {
  let gatewayApiKey = uuidv4();
  if (apiKey === '') {
    writeFileSync(
      join('workspace/evm', jobId, 'config', 'secrets.env'),
      utils.formatSecrets([
        `AIRNODE_WALLET_MNEMONIC=${mnemonic}`,
        `CHAIN_PROVIDER_URL=${provider}`,
        `HTTP_GATEWAY_API_KEY=${gatewayApiKey}`,
      ]),
    );
  } else {
    writeFileSync(
      join('workspace/evm', jobId, 'config', 'secrets.env'),
      utils.formatSecrets([
        `AIRNODE_WALLET_MNEMONIC=${mnemonic}`,
        `CHAIN_PROVIDER_URL=${provider}`,
        `HTTP_GATEWAY_API_KEY=${gatewayApiKey}`,
        `API_KEY=${apiKey}`,
      ]),
    );
  }
}

export async function deployDapi(jobId: string) {
  let cmd = `cd workspace/evm/${jobId} && docker run --rm \
    --env-file ../../aws.env \
    -e USER_ID=$(id -u) -e GROUP_ID=$(id -g) \
    -v "$(pwd)/config:/app/config" \
    -v "$(pwd)/output:/app/output" \
    api3/airnode-deployer:songtianyi deploy`;
  console.log('deploy cmd:', cmd);
  execSync(cmd);
}

export async function deployDapiLocal(jobId: string) {
  let cmd = `cd workspace/evm/${jobId} && docker run --detach \
    --net host \
    --volume "$(pwd)/config:/app/config" \
    --name ${jobId} \
    api3/airnode-client:0.7.2`;
  console.log('deploy cmd:', cmd);
  execSync(cmd);
}
