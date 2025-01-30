
export type Account = {
    username: string;
    email: string;
    phone: string;
    address: string;
    shortDescription: string;
    avatarUrl?: string;
    level: string;
    status: number;
    desiredLevel: number;
    desiredTargets: string[];
    favoriteMusicGenres: string[];
    preferredLearningMethods: string[];
};

export type SignUpRequest = {

} & Omit<Account, 'level' | 'status' | 'avatarUrl' | 'address' | 'username'>;