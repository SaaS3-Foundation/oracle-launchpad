import * as utils from "./oracle.utils";
import { execSync } from 'child_process';
import { writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { OIS } from '@api3/ois';
import { createConfig } from './create-config';
import { createHardhatConfig, createRequester, createTestRequester } from './create-contract';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import Web3 from 'web3';


const sponsorMnemonic = "aisle genuine false door mouse sustain caught flock pyramid sister scan disease";
const sponsor = "0x944e24Ded49747c8278e3D3b4148da68e5B6672C";
const sponsorWallet = "0xdb2E1351c5De993629e703b51A730D7A6Ed24271"
// saas3
const provider = "http://150.109.145.144:9101"
const airnodeRrp = "0xebd9ffD45a96f01D7Aa334d4b45dF70eF2cad31d";
const chainId = "1280";
const network = "saas3-testnet";

// moonbeam alpha
// const airnodeRrp = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd"
// const provider = "https://rpc.api.moonbase.moonbeam.network";
// const chainId = "1287";
// const network = "Moonbase Alpha";

// Rinkeby
// const airnodeRrp = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd"
// const provider = "https://rinkeby.infura.io/v3/";
// const chainId = "4";
// const network = "Rinkeby";

export async function generateAirnodeAddress() {
    let mne = await utils.generateMnemonic();
    let addr = await utils.derive(mne);
    return [mne, addr] as const;
}

export async function sponsorRequester(requester: string) {
    let cmd = `npx @api3/airnode-admin sponsor-requester \
     --provider-url ${provider} \
     --airnode-rrp-address ${airnodeRrp} \
     --sponsor-mnemonic "${sponsorMnemonic}" \
     --requester-address ${requester}`;
    console.log("sposor cmd:", cmd);
    execSync(cmd)
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

export async function generateRequester(jobId: string, airnodeAddress: string, requesterName: string) {
    // generate contract
    let requesterContract = await createRequester(airnodeAddress, sponsor, sponsorWallet, requesterName);
    console.log(requesterContract);
    writeFileSync(join('workspace', jobId, `contracts/${requesterName}.sol`), requesterContract);

    // generate hardhat config
    let hardhatCfg = await createHardhatConfig(network, provider, sponsorMnemonic);
    console.log(hardhatCfg);
    writeFileSync(join('workspace', jobId, `hardhat.config.ts`), hardhatCfg);

    // compile
    let cmd = `cd workspace/${jobId} && npx hardhat compile`;
    console.log(cmd);
    execSync(cmd)
}

export async function deployWithWeb3(abi: any, bytecode: any) {
    const web3 = new Web3(provider);
    let prikey = utils.getUserWallet(sponsorMnemonic, provider).privateKey;
    const accountFrom = {
        privateKey: prikey,
    };
    let signer = web3.eth.accounts.privateKeyToAccount(prikey);
    web3.eth.accounts.wallet.add(signer);

    const incrementer = new web3.eth.Contract(abi);
    const incrementerTx = incrementer.deploy({ data: bytecode, arguments: [airnodeRrp] });
    const tx = await web3.eth.accounts.signTransaction(
        {
            data: incrementerTx.encodeABI(),
            gas: await incrementerTx.estimateGas(),
        },
        accountFrom.privateKey
    );
    const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
    console.log(`Contract deployed at address: ${receipt.contractAddress}`);
    return { address: receipt.contractAddress };
}


async function deployWithEtherjs(abi: any, bytecode: string) {
    const contractFactory = new ethers.ContractFactory(abi, bytecode,
        utils.getUserWallet(sponsorMnemonic, provider));
    let args = [airnodeRrp];
    const contract = await contractFactory.deploy(...args, { gasLimit: 500000 });
    await contract.deployed();
    return contract;
}

export const deployRequester = async (jobId: string, requesterName: string) => {
    const artifact = getArtifact(jobId, requesterName);

    console.log("Deploying contract...");

    return deployWithWeb3(artifact.abi, artifact.bytecode);

};

const getArtifact = (jodId: string, requesterName: string) => {
    const artifactPath = join(__dirname, '../workspace', jodId, 'artifacts/contracts',
        requesterName + '.sol', requesterName + '.json');
    return require(artifactPath);
};

export async function generateConfig(jobId: string, o: any) {
    let config = await createConfig(airnodeRrp, chainId, [o])
    let ois = config.ois[0];
    let triggers = [];
    ois.endpoints.forEach(endpoint => {
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