export interface IOrganizationUserRole {
  organizationId: string;
  userId: string;
  roleId: string;
  assignedAt?: string;
}

export class OrganizationUserRole implements IOrganizationUserRole {
  organizationId: string;
  userId: string;
  roleId: string;
  assignedAt?: string;

  constructor(data: Partial<IOrganizationUserRole> = { organizationId: '', userId: '', roleId: '' }) {
    this.organizationId = data.organizationId ?? '';
    this.userId = data.userId ?? '';
    this.roleId = data.roleId ?? '';
    this.assignedAt = data.assignedAt;
  }
}
