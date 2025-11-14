export interface IRolePermission {
  roleId: string;
  permissionId: string;
  grantedAt?: string;
}

export class RolePermission implements IRolePermission {
  roleId: string;
  permissionId: string;
  grantedAt?: string;

  constructor(data: Partial<IRolePermission> = { roleId: '', permissionId: '' }) {
    this.roleId = data.roleId ?? '';
    this.permissionId = data.permissionId ?? '';
    this.grantedAt = data.grantedAt;
  }
}
