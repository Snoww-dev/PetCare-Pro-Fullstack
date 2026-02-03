import { create } from 'zustand';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import type { AuthState } from '@/types/store';

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => set({ accessToken: null, user: null, loading: false }),

    login: async (username, password) => {
        try {
            set({ loading: true });
            // Simulate an API call
            const accessToken = await authService.login(username, password);
            // On success, set user and accessToken (mock values here)
            set({ accessToken });
            toast.success('Login successful!');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again.');
        } finally {
            set({ loading: false });
        }
    },

    logout: async () => {
        try {
            get().clearState();
            await authService.logout();
            toast.success('Logout successful!');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed. Please try again.');
        } 
    }
}));