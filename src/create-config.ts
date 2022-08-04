import { Config } from '@api3/airnode-node';


export const createConfig = async (airnodeRrpAddress: string, chainId: string, oises: [any]): Promise<Config> => ({
  chains: [
    {
      maxConcurrency: 100,
      authorizers: [],
      contracts: {
        AirnodeRrp: airnodeRrpAddress,
      },
      id: chainId,
      providers: {
        "saas3": {
          url: '${CHAIN_PROVIDER_URL}',
        },
      },
      type: 'evm',
      options: {
        "txType": "eip1559",
        fulfillmentGasLimit: 500_000,
      },
    },
  ],
  nodeSettings: {
    cloudProvider: {
      "type": "aws",
      "region": "us-east-1",
      "disableConcurrencyReservations": true
    },
    airnodeWalletMnemonic: '${AIRNODE_WALLET_MNEMONIC}',
    heartbeat: {
      enabled: false,
    },
    httpGateway: {
      enabled: true,
      apiKey: '${HTTP_GATEWAY_API_KEY}',
      maxConcurrency: 10,
    },
    httpSignedDataGateway: {
      enabled: false,
    },
    logFormat: 'plain',
    logLevel: 'DEBUG',
    nodeVersion: "0.7.2",
    stage: 'dev',
  },
  triggers: {
    rrp: [],
    http: [],
    httpSignedData: [],
  },
  templates: [],
  ois: oises,
  apiCredentials: [],
});
