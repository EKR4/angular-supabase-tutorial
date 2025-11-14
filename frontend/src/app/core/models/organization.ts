export interface IOrganization {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Organization implements IOrganization {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;

  constructor(data: Partial<IOrganization> = { name: '' }) {
    this.id = data.id;
    this.name = data.name ?? '';
    this.slug = data.slug;
    this.description = data.description;
    this.logoUrl = data.logoUrl;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
