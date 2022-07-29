import { Config } from '@api3/airnode-node';


const createConfig = async (airnodeAddress: string, chainId: string): Promise<Config> => ({
  chains: [
    {
      maxConcurrency: 100,
      authorizers: [],
      contracts: {
        AirnodeRrp: airnodeAddress,
      },
      id: chainId,
      providers: {
        "saas3": {
          url: '${PROVIDER_URL}',
        },
      },
      type: 'evm',
      options: {
        fulfillmentGasLimit: 500_000,
        "txType": "eip1559",
      },
    },
  ],
  nodeSettings: {
    cloudProvider: null,
    airnodeWalletMnemonic: '${AIRNODE_WALLET_MNEMONIC}',
    heartbeat: {
      enabled: false,
    },
    httpGateway: {
      enabled: false,
    },
    httpSignedDataGateway: {
      enabled: false,
    },
    logFormat: 'plain',
    logLevel: 'DEBUG',
    nodeVersion: "1.0.0",
    stage: 'dev',
  },
  triggers: {
    rrp: [],
    http: [],
    httpSignedData: [],
  },
  templates: [],
  ois: [],
  apiCredentials: [],
});

export default createConfig;
