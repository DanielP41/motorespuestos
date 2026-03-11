import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    nombre_completo?: string;
    role: 'admin' | 'vendedor' | 'cliente';
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('moto_token'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('moto_token');
    }, []);

    const fetchUserProfile = useCallback(async (authToken: string) => {
        try {
            const resp = await fetch('http://localhost:8001/auth/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (resp.ok) {
                const userData = await resp.json();
                setUser(userData);
                return true;
            } else {
                logout();
                return false;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            logout();
            return false;
        }
    }, [logout]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const resp = await fetch('http://localhost:8001/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (resp.ok) {
                const data = await resp.json();
                const newToken = data.access_token;
                setToken(newToken);
                localStorage.setItem('moto_token', newToken);
                return await fetchUserProfile(newToken);
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }, [fetchUserProfile]);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                await fetchUserProfile(token);
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token, fetchUserProfile]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!user,
            user,
            token,
            login,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
