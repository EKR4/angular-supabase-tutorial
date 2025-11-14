export interface IUser {
	id?: string; // uuid
	email: string;
	isActive?: boolean;
	createdAt?: string; // ISO timestamp
	updatedAt?: string;
	lastLogin?: string;
	metadata?: any;
	displayName?: string;
	avatarUrl?: string;
}

export class User implements IUser {
	id?: string;
	email: string;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
	lastLogin?: string;
	metadata?: any;
	displayName?: string;
	avatarUrl?: string;

	constructor(data: Partial<IUser> = { email: '' }) {
		this.id = data.id;
		this.email = data.email ?? '';
		this.isActive = data.isActive ?? true;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
		this.lastLogin = data.lastLogin;
		this.metadata = data.metadata;
		this.displayName = data.displayName;
		this.avatarUrl = data.avatarUrl;
	}

	static fromJson(json: any): User {
		return new User({
			id: json?.id,
			email: json?.email,
			isActive: json?.is_active ?? json?.isActive,
			createdAt: json?.created_at ?? json?.createdAt,
			updatedAt: json?.updated_at ?? json?.updatedAt,
			lastLogin: json?.last_login ?? json?.lastLogin,
			metadata: json?.metadata,
			displayName: json?.display_name ?? json?.displayName,
			avatarUrl: json?.avatar_url ?? json?.avatarUrl,
		});
	}
}
