// for deploying dRuntime and phala anchor contracts
import * as crypto from 'crypto';
import { join } from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';
import {ApiPromise, WsProvider, Keyring} from '@polkadot/api';
import {ContractPromise} from '@polkadot/api-contract';
import sdk from '@phala/sdk';
import { TxQueue, blockBarrier, hex, checkUntil, checkUntilEq } from './phat.utils';

const CONTRACT_NAMES = [
    ['sample_oracle', 'sample_oracle'],
]

function loaddRuntime(name: string) {
    const wasmPath = `../workspace/phala/dRuntime-fat/target/ink/${name}.wasm`;
    const metadataPath: string = `../../target/ink/${name}/metadata.json`;
    const wasm = hex(fs.readFileSync(wasmPath, 'hex'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath).toString());
    const constructor = metadata.V3.spec.constructors.find(c => c.label == 'new').selector;
    return {wasm: wasm, metadata: metadata, constructor: constructor};
}

function loaddRuntimeArtifacts() {
    return Object.assign(
        {}, ...CONTRACT_NAMES.map(
            ([filename, name]) => ({[name]: loaddRuntime(filename)})
        )
    );
}

export function buildAnchor() {
    let cmd = `cd ../workspace/phala/phat-stateful-rollup/evm/contracts && npx hardhat compile`;
    console.log("Compiling anchor contract ...:\n", cmd);
    execSync(cmd);
    console.log("Compiling anchor contract done");
}

export function loadAnchorArtifact() {
    const artifactPath = join(
        __dirname,
        '../workspace/evm',
        'artifacts/contracts',
        'PhatRollupAnchor.sol',
        'PhatRollupAnchor.json',
      );
      return require(artifactPath);
}


export function builddRuntime() {
    let cmd = `cargo +nightly contract build --release --manifest-path ../../dRuntime/Cargo.toml`;
    console.log('Building dRuntime:\n', cmd);
    execSync(cmd);
    console.log("Build dRuntime done.")
}


function loadCode(path: string) {
    const content = fs.readFileSync(path, {encoding: 'utf-8'});
    return content.split('\n').map(x => x.trim()).filter(x => !!x);
}

export async function deploydRuntime() {
    const clusterId = process.env.CLUSTER_ID || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const privkey = process.env.PRIVKEY || '//Alice';
    const chainUrl = process.env.CHAIN || 'wss://poc5.phala.network/ws';
    const pruntimeUrl = process.env.PRUNTIME || 'https://poc5.phala.network/tee-api-1';

    const artifacts = loaddRuntimeArtifacts();

    // connect to the chain
    const wsProvider = new WsProvider(chainUrl);
    const api = await ApiPromise.create({
        provider: wsProvider,
        types: {
            ...sdk.types,
            //'GistQuote': {
            //    username: 'String',
            //    accountId: 'AccountId',
            //},
        }
    });
    const txqueue = new TxQueue(api);

    // prepare accounts
    const keyring = new Keyring({type: 'sr25519'})
    const pair = keyring.addFromUri(privkey);
    const cert = await sdk.signCertificate({api, pair});

    // connect to pruntime
    const prpc = sdk.createPruntimeApi(pruntimeUrl);
    const connectedWorker = hex((await prpc.getInfo({})).publicKey);
    console.log('Connected worker:', connectedWorker);

    // contracts
    await deploy(api, txqueue, pair, artifacts, clusterId);
    
    //// create Fat Contract objects
    //const contracts = {};
    //for (const [name, contract] of Object.entries(artifacts)) {
    //    const contractId = contract.address;
    //    const newApi = await api.clone().isReady;
    //    contracts[name] = new ContractPromise(
    //        await sdk.create({api: newApi, baseURL: pruntimeUrl, contractId}),
    //        contract.metadata,
    //        contractId
    //    );
    //}
    //console.log('Fat Contract: connected');
    //const { FatBadges, EasyOracle, AdvancedJudger } = contracts;

    
    //// set up the contracts
    //const easyBadgeId = 0;
    //const advBadgeId = 1;
    //await txqueue.submit(
    //    api.tx.utility.batchAll([
    //        // set up the badges; assume the ids are 0 and 1.
    //        FatBadges.tx.newBadge({}, 'fat-easy-challenge'),
    //        FatBadges.tx.newBadge({}, 'fat-adv-challenge'),
    //        // fill with code
    //        FatBadges.tx.addCode({}, easyBadgeId, codeEasy),
    //        FatBadges.tx.addCode({}, advBadgeId, codeAdv),
    //        // set the issuers
    //        FatBadges.tx.addIssuer({}, easyBadgeId, artifacts.EasyOracle.address),
    //        FatBadges.tx.addIssuer({}, advBadgeId, artifacts.AdvancedJudger.address),
    //        // config the issuers
    //        EasyOracle.tx.configIssuer({}, artifacts.FatBadges.address, easyBadgeId),
    //        AdvancedJudger.tx.configIssuer({}, artifacts.FatBadges.address, advBadgeId),
    //    ]),
    //    pair,
    //    true,
    //);

    //// wait for the worker to sync to the bockchain
    //await blockBarrier(api, prpc);

    //// basic checks
    //console.log('Fat Contract: basic checks');
    //console.assert(
    //    (await FatBadges.query.getTotalBadges(cert, {})).output.toNumber() == 2,
    //    'Should have two badges created'
    //);

    //const easyInfo = await FatBadges.query.getBadgeInfo(cert, {}, easyBadgeId);
    //console.log('Easy badge:', easyInfo.output.toHuman());

    //const advInfo = await FatBadges.query.getBadgeInfo(cert, {}, advBadgeId);
    //console.log('Adv badge:', advInfo.output.toHuman());

    //console.log('Deployment finished');
}


async function deploy(api: any, txqueue: any, pair: any, artifacts: Map<string, any>, clusterId: any) {
    console.log('Contracts: uploading');
    // upload contracts
    const contractNames = Object.keys(artifacts);
    const { events: deployEvents } = await txqueue.submit(
        api.tx.utility.batchAll(
            Object.entries(artifacts).flatMap(([_k, v]) => [
                api.tx.phalaFatContracts.clusterUploadResource(clusterId, 'InkCode', v.wasm),
                api.tx.phalaFatContracts.instantiateContract(
                    { WasmCode: v.metadata.source.hash },
                    v.constructor,
                    hex(crypto.randomBytes(4).toString('hex')), // salt
                    clusterId,
                )
            ])
        ),
        pair
    );
    const contractIds = deployEvents
        .filter(ev => ev.event.section == 'phalaFatContracts' && ev.event.method == 'Instantiating')
        .map(ev => ev.event.data[0].toString());
    const numContracts = contractNames.length;
    console.assert(contractIds.length == numContracts, 'Incorrect length:', `${contractIds.length} vs ${numContracts}`);
    for (const [i, id] of contractIds.entries()) {
        artifacts[contractNames[i]].address = id;
    }
    await checkUntilEq(
        async () => (await api.query.phalaFatContracts.clusterContracts(clusterId))
            .filter(c => contractIds.includes(c.toString()) )
            .length,
        numContracts,
        4 * 6000
    );
    console.log('Contracts: uploaded');
    for (const [name, contract] of Object.entries(artifacts)) {
        await checkUntil(
            async () => (await api.query.phalaRegistry.contractKeys(contract.address)).isSome,
            4 * 6000
        );
        console.log('Contracts:', contract.address, name, 'key ready');
    }
    console.log('Contracts: deployed');
}
