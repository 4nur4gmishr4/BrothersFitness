"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AdminContextType = {
    isAdmin: boolean;
    isLoading: boolean;
    login: (password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    establishSession: (token?: string) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                if (typeof window === 'undefined') {
                    setIsLoading(false);
                    return;
                }

                const token = sessionStorage.getItem('admin_token');
                const isAdminPath = window.location.pathname.startsWith('/admin');

                // If not on an admin route and has no stored token in session, skip verify fetch
                if (!token && !isAdminPath) {
                    setIsAdmin(false);
                    setIsLoading(false);
                    return;
                }

                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/admin/verify', {
                    headers,
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setIsAdmin(Boolean(data.valid));
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

    const establishSession = (token?: string) => {
        if (token && typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('admin_token', token);
            } catch { /* storage restricted */ }
        }
        setIsAdmin(true);
    };

    return (
        <AdminContext.Provider value={{ isAdmin, isLoading, login, logout, establishSession }}>
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
