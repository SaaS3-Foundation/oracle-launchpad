import { ChainType } from '@api3/airnode-node';
import { UserInfo } from 'os';
import { ChainInfo, CreatorInfo, OracleInfo } from './dapi/dapi.entity';

export class HttpRequest {
  uri: string;
  method: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: any;
}

export class OracleRequest {
  oracleInfo: OracleInfo;
  creatorInfo: CreatorInfo;
}
