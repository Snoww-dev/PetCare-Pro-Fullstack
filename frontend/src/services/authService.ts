import api from "@/lib/axios";

export const authService = {
    login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password }, { withCredentials: true });
        return response.data;
    },
    logout: async () => {
        await api.post('/auth/logout', {}, { withCredentials: true });
    }
}