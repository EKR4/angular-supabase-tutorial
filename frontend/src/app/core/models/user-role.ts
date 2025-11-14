export interface IUserRole {
  userId: string;
  roleId: string;
  assignedAt?: string;
}

export class UserRole implements IUserRole {
  userId: string;
  roleId: string;
  assignedAt?: string;

  constructor(data: Partial<IUserRole> = { userId: '', roleId: '' }) {
    this.userId = data.userId ?? '';
    this.roleId = data.roleId ?? '';
    this.assignedAt = data.assignedAt;
  }
}
