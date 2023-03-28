// for deploying dRuntime and phala anchor contracts
import * as crypto from 'crypto';
import { join } from 'path';
import * as fs from 'fs';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { typeDefinitions } from '@polkadot/types';
import * as Phala from '@phala/sdk';
import * as utils from './utils/oracle.utils';
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
import { BlobOptions } from 'buffer';

const CENTS = 10_000_000_000;

export function loadFatContract(contractPath: string) {
  const f = fs.readFileSync(contractPath);
  const contract = JSON.parse(f.toString());
  const constructor = contract.V3.spec.constructors.find(
    (c: any) => c.label === 'default',
  ).selector;
  const { name } = contract.contract;
  const { wasm } = contract.source;
  const { hash } = contract.source;
  return {
    hash,
    wasm,
    contract,
    constructor,
    name,
    address: '',
  };
}

export function loadAnchorArtifact(path: string) {
  return require(path);
}

export async function configFatContract(
  mnemonic,
  chainUrl,
  pruntimeUrl,
  contractPath,
  systemContractPath,
  address,
  name,
  args,
) {
  console.log('config args', args);
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });

  // Prepare accounts
  const sponsor = keyring.addFromUri(mnemonic);

  const artifact = loadFatContract(contractPath);
  artifact.address = address;

  // connect to the chain
  const wsProvider = new WsProvider(chainUrl);
  console.log('connected to', chainUrl);
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
  console.log('api created.');
  const cert = await Phala.signCertificate({ api, pair: sponsor });
  console.log('cert signed.');

  const txqueue = new TxQueue(api);
  console.log('queue created.');
  // connect to pruntime
  const prpc = Phala.createPruntimeApi(pruntimeUrl);
  console.log('prpc connected.');
  const connectedWorker = hex((await prpc.getInfo({})).publicKey);
  console.log('Connected worker:', connectedWorker);

  console.log('attaching fat contract', artifact.address, '...');

  let contract = await contractApi(api, pruntimeUrl, artifact);
  console.log('Fat Contract: connected', artifact.address);

  // set up the contracts
  const estimate = await contract.contractApi.query[name](
    cert as any,
    {},
    ...args,
  );
  await txqueue.submit(
    contract.contractApi.tx[name](
      {
        gasLimit: estimate.gasRequired,
        storageDepositLimit: estimate.storageDeposit.isCharge
          ? estimate.storageDeposit.asCharge
          : null,
      },
      ...args,
    ),
    sponsor,
    true,
  );

  console.log('configured, waitting to sync ...');

  // wait for the worker to sync to the bockchain
  await blockBarrier(api, prpc);

  console.log('Config finished');
}

export async function deployFatContract(
  mnemonic: string,
  clusterId: string,
  chainUrl: string,
  pruntimeUrl: string,
  contractPath: string,
  isQjs: boolean = false,
  systemContractPath,
) {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });

  // Prepare accounts
  const sponsor = keyring.addFromUri(mnemonic);

  const artifact = loadFatContract(contractPath);

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
  const address = await submit(
    api,
    txqueue,
    sponsor,
    cert,
    artifact,
    clusterId,
    pruntimeUrl,
    '',
    isQjs,
    systemContractPath,
  );
  artifact.address = address;
  console.log(address);

  await blockBarrier(api, prpc);

  console.log('Deployment finished');
  return address;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function submit(
  api,
  txqueue,
  account,
  cert,
  artifact,
  clusterId,
  pruntimeUrl,
  salt,
  isQjs: boolean = false,
  systemContractPath,
) {
  salt = salt || hex(crypto.randomBytes(4));

  console.log('transfering to cluster ...');
  await txqueue.submit(
    api.tx.phalaFatContracts.transferToCluster(
      2e12,
      clusterId,
      account.address,
    ),
    account,
  );

  console.log('Contracts: uploading', artifact.name);

  // upload the contract
  if (isQjs == true) {
    await txqueue.submit(
      api.tx.phalaFatContracts.clusterUploadResource(
        clusterId,
        'IndeterministicInkCode',
        hex(artifact.wasm),
      ),
      account,
    );
    return;
  } else {
    await txqueue.submit(
      api.tx.phalaFatContracts.clusterUploadResource(
        clusterId,
        'InkCode',
        artifact.wasm,
      ),
      account,
    );
  }

  // Not sure how much time it would take to sync the code into pruntime
  console.log(
    'Waiting the code to be synced into pruntime to estmate the instantiation',
  );
  await sleep(10000);
  console.log(`Contracts: ${artifact.name} uploaded`);

  const system = loadFatContract(systemContractPath);
  console.log('system loaded ', system.name, system.hash);

  console.log('quering cluster', clusterId);
  const clusterInfo = await api.query.phalaFatContracts.clusters(clusterId);
  console.log('cluster info', clusterInfo);
  system.address = clusterInfo.unwrap().systemContract.toHex();

  console.log('creating system contract api ...');
  let r = await contractApi(api, pruntimeUrl, system);
  let systemContract = r.contractApi;
  console.log('systemContract', systemContract.address, 'connected.');

  console.log('quering', account.address, 'free balance');
  const { output } = await systemContract.query['system::freeBalanceOf'](
    cert,
    {},
    account.address,
  );
  console.log('freeBalance:', output);

  const instantiateReturn = await r.phala.instantiate(
    {
      // @ts-ignore
      codeHash: system.hash,
      salt,
      instantiateData: system.constructor, // please concat with args if needed
      deposit: 0,
      transfer: 0,
    },
    cert,
  );

  console.log('instantiate result:', instantiateReturn);
  const queryResponse = api.createType('InkResponse', instantiateReturn);
  const queryResult = queryResponse.result.toHuman();
  console.log('InkMessageReturn', queryResult.Ok.InkMessageReturn);
  const instantiateResult = api.createType(
    'ContractInstantiateResult',
    queryResult.Ok.InkMessageReturn,
  );
  console.log('instatiateResult', instantiateResult);
  console.assert(instantiateResult.result.isOk);
  console.log('gasRequired', instantiateResult.gasRequired);

  console.log('Contracts: instantiating', artifact.name);
  const { events: deployEvents } = await txqueue.submit(
    api.tx.phalaFatContracts.instantiateContract(
      { WasmCode: artifact.hash },
      artifact.constructor,
      salt,
      clusterId,
      0,
      instantiateResult.gasRequired.refTime,
      instantiateResult.storageDeposit.asCharge || 0,
      100000000000,
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
  console.log('uploaded contract ids', contractIds);

  const numContracts = 1;
  console.assert(
    contractIds.length === numContracts,
    'Incorrect length:',
    `${contractIds.length} vs ${numContracts}`,
  );
  // eslint-disable-next-line prefer-destructuring
  artifact.address = contractIds[0];

  await checkUntilEq(
    async () =>
      (
        await api.query.phalaFatContracts.clusterContracts(clusterId)
      ).filter((c) => contractIds.includes(c.toString())).length,
    numContracts,
    60 * 1000,
  );

  console.log('Contracts: deployed');
  return artifact.address;
}

export async function deployWithWeb3(
  provider: string,
  sponsorMnemonic: string,
  abi: any,
  bytecode: any,
  args: any[],
) {
  const web3 = new Web3(provider);
  console.log('provider connected.', provider);
  const prikey = utils.getUserWallet(sponsorMnemonic, provider).privateKey;
  const accountFrom = {
    privateKey: prikey,
  };
  const signer = web3.eth.accounts.privateKeyToAccount(prikey);
  web3.eth.accounts.wallet.add(signer);

  const incrementer = new web3.eth.Contract(abi);
  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: args,
  });
  const tx = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
      //gasPrice: web3.utils.toWei('1000', 'gwei'),
    },
    accountFrom.privateKey,
  );
  console.log('sending transaction ...');
  const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
  console.log(`Contract deployed at address: ${receipt.contractAddress}`);
  return { address: receipt.contractAddress, abi: abi };
}

export async function configAnchor(
  provider: string,
  abi: any,
  addr: string,
  sponsorMnemonic: string,
  args: any,
  gasLimit: number,
) {
  const web3 = new Web3(provider);
  const anchor = new web3.eth.Contract(abi as any, addr);

  let prikey = utils.getUserWallet(sponsorMnemonic, provider).privateKey;
  let signer = web3.eth.accounts.privateKeyToAccount(prikey);
  web3.eth.accounts.wallet.add(signer);

  const r_nonce = await web3.eth.getTransactionCount(addr, 'pending');
  console.log('nonce', r_nonce);

  console.log('configuring anchor...');
  let gas_price = await web3.eth.getGasPrice();
  console.log('gas_price', gas_price);

  let c = anchor.methods['config'](args);
  let eg =
    (await web3.eth.estimateGas({
      from: signer.address,
      to: addr,
      data: c.encodeABI(),
    })) * 10;
  if (gasLimit > eg) {
    eg = gasLimit;
  }

  let receipt = await web3.eth.sendTransaction({
    from: signer.address,
    to: addr,
    data: c.encodeABI(),
    gas: eg,
    gasPrice: gas_price,
  });

  console.log('configuring anchor done. receipt:', receipt);
  return { ok: true, retry: false };
}

export async function contractApi(api, pruntimeURL, contract) {
  const newApi = await api.clone().isReady;
  const phala = await Phala.create({
    api: newApi,
    baseURL: pruntimeURL,
    contractId: contract.address,
    autoDeposit: true,
  });
  const contractApi = new ContractPromise(
    phala.api,
    contract.contract,
    contract.address,
  );
  return { contractApi, phala };
}
