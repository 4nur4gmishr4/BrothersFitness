"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AdminContextType = {
    isAdmin: boolean;
    isLoading: boolean;
    login: (password: string) => Promise<boolean>;
    logout: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/admin/verify');
                if (res.ok) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch {
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (password: string): Promise<boolean> => {
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                setIsAdmin(true);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
        } catch { /* revocation is best-effort */ }
        setIsAdmin(false);
    };

    return (
        <AdminContext.Provider value={{ isAdmin, isLoading, login, logout }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
