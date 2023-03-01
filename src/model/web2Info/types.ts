export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE';

export enum AuthType {
  NoAuth,
  ApiKeyInUrl,
  ApiKeyInHeader,
  BearerToken,
}
