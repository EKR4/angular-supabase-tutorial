export interface IPermission {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export class Permission implements IPermission {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;

  constructor(data: Partial<IPermission> = { name: '' }) {
    this.id = data.id;
    this.name = data.name ?? '';
    this.description = data.description;
    this.createdAt = data.createdAt;
  }

  static fromJson(json: any): Permission {
    return new Permission({
      id: json?.id,
      name: json?.name,
      description: json?.description,
      createdAt: json?.created_at ?? json?.createdAt,
    });
  }
}
