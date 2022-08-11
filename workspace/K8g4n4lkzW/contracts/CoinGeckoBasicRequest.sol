//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

contract CoinGeckoBasicRequest is RrpRequesterV0 {
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
            address(0x2156217a193B4bC6c3c24012611D124310663060),
            endpointId,
            address(0x944e24Ded49747c8278e3D3b4148da68e5B6672C),
            address(0xdb2E1351c5De993629e703b51A730D7A6Ed24271),
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
}