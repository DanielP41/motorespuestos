import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    user: { name: string; email?: string; role: 'admin' | 'customer' } | null;
    login: (password: string, email?: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials
const MOCK_ADMIN_PASSWORD = 'admin2026';
const MOCK_CUSTOMER_EMAIL = 'cliente@ejemplo.com';
const MOCK_CUSTOMER_PASSWORD = 'cliente123';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthContextType['user']>(() => {
        try {
            const saved = sessionStorage.getItem('moto_user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const login = useCallback(async (password: string, email?: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(res => setTimeout(res, 600));

        // Admin log-in
        if (password === MOCK_ADMIN_PASSWORD && (!email || email === 'admin@3mmotos.com')) {
            const u = { name: 'Admin', role: 'admin' as const };
            setUser(u);
            sessionStorage.setItem('moto_user', JSON.stringify(u));
            return true;
        }

        // Customer log-in
        if (password === MOCK_CUSTOMER_PASSWORD && (!email || email === MOCK_CUSTOMER_EMAIL)) {
            const u = { name: 'Cliente Valorado', email: MOCK_CUSTOMER_EMAIL, role: 'customer' as const };
            setUser(u);
            sessionStorage.setItem('moto_user', JSON.stringify(u));
            return true;
        }

        return false;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('moto_user');
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
