export interface IAuthProvider {
  id?: string;
  userId: string;
  provider: string;
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  providerMetadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export class AuthProvider implements IAuthProvider {
  id?: string;
  userId: string;
  provider: string;
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  providerMetadata?: any;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: Partial<IAuthProvider> = { userId: '', provider: '', providerUserId: '' }) {
    this.id = data.id;
    this.userId = data.userId ?? '';
    this.provider = data.provider ?? '';
    this.providerUserId = data.providerUserId ?? '';
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.tokenExpiresAt = data.tokenExpiresAt;
    this.providerMetadata = data.providerMetadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
