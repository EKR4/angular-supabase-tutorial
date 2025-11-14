export interface IRole {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Role implements IRole {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: Partial<IRole> = { name: '' }) {
    this.id = data.id;
    this.name = data.name ?? '';
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromJson(json: any): Role {
    return new Role({
      id: json?.id,
      name: json?.name,
      description: json?.description,
      createdAt: json?.created_at ?? json?.createdAt,
      updatedAt: json?.updated_at ?? json?.updatedAt,
    });
  }
}
