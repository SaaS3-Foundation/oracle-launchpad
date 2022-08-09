

export async function createRequester(airnodeAddress: string, sponsor: string, sponsorWallet: string, requesterName: string) {
    return `//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

contract ${requesterName} is RrpRequesterV0 {
    mapping(bytes32 => bool) public incomingFulfillments;
    mapping(bytes32 => address) callbacks;
    mapping(bytes32 => bytes4) callbacksFn;

    constructor(address airnodeRrp) RrpRequesterV0(airnodeRrp) {}

    function makeRequest(
        bytes32 endpointId,
        address fulfillAddress,
        bytes4 fulfillFunctionId,
        bytes calldata parameters
    ) external {
        bytes32 requestId = airnodeRrp.makeFullRequest(
            address(${airnodeAddress}),
            endpointId,
            address(${sponsor}),
            address(${sponsorWallet}),
            address(this),
            this.fulfill.selector,
            parameters
        );
        callbacks[requestId] = fulfillAddress;
        callbacksFn[requestId] = fulfillFunctionId;
        incomingFulfillments[requestId] = true;
    }

    function fulfill(bytes32 requestId, bytes calldata data)
        external
        onlyAirnodeRrp
    {
        require(incomingFulfillments[requestId], "No such request made");
        delete incomingFulfillments[requestId];
        callbacks[requestId].call( // solhint-disable-line avoid-low-level-calls
            abi.encodeWithSelector(callbacksFn[requestId], requestId, data)
        );
    }
}`;
}


export async function createHardhatConfig(network: string, provider: string, mnemonic: string) {
    return `import { HardhatUserConfig } from 'hardhat/types';
    import '@nomiclabs/hardhat-waffle';
    import '@nomiclabs/hardhat-ethers';
    
    
    const networks: any = {};
    networks["${network}"] = {
        url: "${provider}",
        accounts: { mnemonic: "${mnemonic}" }
      };
    
    const config: HardhatUserConfig = {
      defaultNetwork: "${network}",
      networks,
      solidity: '0.8.9'
    };
    
    export default config;
    `
}

export async function createDeployScript(requesterName: string, airnodeRrp: string) { 
    return `import { ethers } from "hardhat";

async function main() {

  const f = await ethers.getContractFactory("${requesterName}");
  let args = ["${airnodeRrp}"];
  const c = await f.deploy(...args, { gasLimit: 500000});

  await c.deployed();

  console.log("Lock with 1 ETH deployed to:", c.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;
}


export async function createDemoContract(requesterName: string, requesterAddress: string) { 
    return `//SPDX-License-Identifier: MIT
// This demo contract is generated automatically by saas3
// EDIT it to adapt to your own dAPI
pragma solidity 0.8.9;
import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

contract Hello  {
    // define your response data here
    /// int256 public fulfilledData;

    function call_dapi(
        bytes32 endpointId,
        bytes calldata parameters
    ) external {
        ${requesterName} c = ${requesterName}(${requesterAddress});
        c.makeRequest(
            endpointId,
            address(this), 
            this.callback.selector, 
            parameters);
    }

    function callback(bytes32 requestId, bytes calldata data) public {
        // decode the data here
        /// decodedData = abi.decode(data, (int256));
        /// any other you want to do
    }
}`
}