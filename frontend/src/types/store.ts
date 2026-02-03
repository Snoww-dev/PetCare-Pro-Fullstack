import type { User } from "./user";

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;
    
    clearState: () => void;

    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};