export interface ISession {
  id?: string;
  userId: string;
  tokenHash?: string;
  userAgent?: string;
  ipAddr?: string;
  createdAt?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export class Session implements ISession {
  id?: string;
  userId: string;
  tokenHash?: string;
  userAgent?: string;
  ipAddr?: string;
  createdAt?: string;
  expiresAt?: string;
  revokedAt?: string;

  constructor(data: Partial<ISession> = { userId: '' }) {
    this.id = data.id;
    this.userId = data.userId ?? '';
    this.tokenHash = data.tokenHash;
    this.userAgent = data.userAgent;
    this.ipAddr = data.ipAddr;
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt;
    this.revokedAt = data.revokedAt;
  }
}
