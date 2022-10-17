import { ethers } from 'ethers';
import Web3 from 'web3';
import * as utils from './utils/oracle.utils';

const sponsorMnemonic =
  'aisle genuine false door mouse sustain caught flock pyramid sister scan disease';
const sponsor = '0x944e24Ded49747c8278e3D3b4148da68e5B6672C';
const sponsorWallet = '0xdb2E1351c5De993629e703b51A730D7A6Ed24271';

// moonbeam alpha
const airnodeRrp = '0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd';
const provider = 'https://rpc.api.moonbase.moonbeam.network';
const chainId = '1287';
const network = 'Moonbase Alpha';

export async function deployWithWeb3(abi: any, bytecode: any) {
    const web3 = new Web3(provider);
    let prikey = utils.getUserWallet(sponsorMnemonic, provider).privateKey;
    const accountFrom = {
      privateKey: prikey,
    };
    let signer = web3.eth.accounts.privateKeyToAccount(prikey);
    web3.eth.accounts.wallet.add(signer);
  
    const incrementer = new web3.eth.Contract(abi);
    const incrementerTx = incrementer.deploy({
      data: bytecode,
      arguments: [airnodeRrp],
    });
    const tx = await web3.eth.accounts.signTransaction(
      {
        data: incrementerTx.encodeABI(),
        gas: await incrementerTx.estimateGas(),
        //gasPrice: web3.utils.toWei('1000', 'gwei'),
      },
      accountFrom.privateKey,
    );
    const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
    console.log(`Contract deployed at address: ${receipt.contractAddress}`);
    return { address: receipt.contractAddress, abi: abi };
  }

  async function deployWithEtherjs(abi: any, bytecode: string) {
    const contractFactory = new ethers.ContractFactory(
      abi,
      bytecode,
      utils.getUserWallet(sponsorMnemonic, provider),
    );
    let args = [airnodeRrp];
    const contract = await contractFactory.deploy(...args, { gasLimit: 500000 });
    await contract.deployed();
    return contract;
  }