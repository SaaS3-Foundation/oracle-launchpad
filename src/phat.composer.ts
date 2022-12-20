// for deploying dRuntime and phala anchor contracts
import * as crypto from 'crypto';
import { join } from 'path';
import * as fs from 'fs';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { typeDefinitions } from '@polkadot/types';
import * as Phala from '@phala/sdk';
import {
  TxQueue,
  blockBarrier,
  hex,
  checkUntil,
  checkUntilEq,
} from './phat.utils';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import Web3 from 'web3';

export function loaddRuntime(contractPath) {
  const f = fs.readFileSync(contractPath);
  const contract = JSON.parse(f.toString());
  console.log(contract);
  const constructor = contract.V3.spec.constructors.find(
    (c: any) => c.label === 'default',
  ).selector;
  const { name } = contract.contract;
  const { wasm } = contract.source;
  const { hash } = contract.source;
  return {
    druntime: {
      hash,
      wasm,
      contract,
      constructor,
      name,
      address: '',
    },
  };
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

export const getUserWallet = (mnemonic: string, url: string) => {
  const provider = new ethers.providers.JsonRpcProvider(url);
  return ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
};

export async function deploydRuntime(
  mnemonic: string,
  clusterId: string,
  chainUrl: string,
  pruntimeUrl: string,
  druntimePath: string,
  config: any,
) {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });

  // Prepare accounts
  const sponsor = keyring.addFromUri(mnemonic);

  const artifacts = loaddRuntime(druntimePath);

  console.log(chainUrl);
  // connect to the chain
  const wsProvider = new WsProvider(chainUrl);
  console.log(wsProvider);
  const api = await ApiPromise.create({
    provider: wsProvider,
    types: {
      ...typeDefinitions.contracts.types,
      GistQuote: {
        username: 'String',
        accountId: 'AccountId',
      },
      ...Phala.types,
    },
  });
  const cert = await Phala.signCertificate({ api, pair: sponsor });

  const txqueue = new TxQueue(api);

  // connect to pruntime
  const prpc = Phala.createPruntimeApi(pruntimeUrl);
  const connectedWorker = hex((await prpc.getInfo({})).publicKey);
  console.log('Connected worker:', connectedWorker);

  // contracts
  const address = await deployContracts(
    api,
    txqueue,
    sponsor,
    cert,
    artifacts,
    clusterId,
    '',
  );
  //const address = '0xcb22a0c52a35981f73e16930b90709ce76441b9b310599258c500856c832aed0';
  artifacts.druntime.address = address;
  console.log(address);

  // create Fat Contract objects
  // todo This line prevents errors.
  let contracts: any = {};

  for (const [name, contract] of Object.entries(artifacts)) {
    const contractId = contract.address;
    console.log(api);
    const newApi = await api.clone().isReady;
    console.log(newApi);
    const t = await Phala.create({
      api: newApi,
      baseURL: pruntimeUrl,
      contractId,
      autoDeposit: true,
    });
    console.log(t);
    console.log(name);
    contracts[name] = new ContractPromise(t.api, contract.contract, contractId);
  }
  console.log('Fat Contract: connected', contracts);
  const druntime = contracts.druntime;

  // set up the contracts
  await txqueue.submit(
    // target_chain_rpc: Option<String>,
    // anchor_contract_addr: Option<H160>,
    // web2_api_url_prefix: Option<String>,
    // api_key: Option<String>,
    druntime.api.tx.config(
      {},
      config.target_chain_rpc, // saas3 protocol rpc
      config.anchor_contract_addr,
      config.web2_api_url_prefix,
      config.api_key,
    ),
    sponsor,
    true,
  );

  // wait for the worker to sync to the bockchain
  await blockBarrier(api, prpc);

  console.log('Deployment finished');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function deployContracts(
  api,
  txqueue,
  account,
  cert,
  artifacts,
  clusterId,
  salt,
) {
  salt = salt || hex(crypto.randomBytes(4));
  console.log('Contracts: uploading', artifacts.druntime.name);

  const { druntime } = artifacts;
  // upload the contract
  await txqueue.submit(
    api.tx.phalaFatContracts.clusterUploadResource(
      clusterId,
      'InkCode',
      druntime.wasm,
    ),
    account,
  );

  // Not sure how much time it would take to sync the code into pruntime
  console.log(
    'Waiting the code to be synced into pruntime to estmate the instantiation',
  );
  await sleep(10000);
  console.log(`Contracts: ${druntime.name} uploaded`);

  console.log('Contracts: instantiating', druntime.name);
  const { events: deployEvents } = await txqueue.submit(
    api.tx.phalaFatContracts.instantiateContract(
      { WasmCode: druntime.hash },
      druntime.constructor,
      salt,
      clusterId,
      0,
      '10000000000000',
      null,
    ),
    account,
  );

  deployEvents.forEach((record) => {
    // Extract the phase, event and the event types
    const { event, phase } = record;
    const types = event.typeDef;

    // Show what we are busy with
    console.log(
      `\t${event.section}:${event.method}:: (phase=${phase.toString()})`,
    );

    // Loop through each of the parameters, displaying the type and data
    event.data.forEach((data, index) => {
      console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
    });
  });

  const contractIds = deployEvents
    .filter(
      (ev) =>
        ev.event.section === 'phalaFatContracts' &&
        ev.event.method === 'Instantiating',
    )
    .map((ev) => ev.event.data[0].toString());
  console.log(contractIds);

  const numContracts = 1;
  console.assert(
    contractIds.length === numContracts,
    'Incorrect length:',
    `${contractIds.length} vs ${numContracts}`,
  );
  // eslint-disable-next-line prefer-destructuring
  druntime.address = contractIds[0];

  await checkUntilEq(
    async () =>
      (
        await api.query.phalaFatContracts.clusterContracts(clusterId)
      ).filter((c) => contractIds.includes(c.toString())).length,
    numContracts,
    60 * 1000,
  );

  console.log('Contracts: deployed');
  return druntime.address;
}
