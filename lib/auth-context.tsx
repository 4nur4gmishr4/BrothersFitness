"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AdminContextType = {
    isAdmin: boolean;
    isLoading: boolean;
    login: (password: string) => Promise<boolean>;
    logout: () => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Use sessionStorage instead of localStorage so auth is required every browser session
                const token = sessionStorage.getItem('admin_token');
                if (token) {
                    const res = await fetch('/api/admin/verify', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setIsAdmin(true);
                    } else {
                        sessionStorage.removeItem('admin_token');
                    }
                }
            } catch {
                sessionStorage.removeItem('admin_token');
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
                const { token } = await res.json();
                sessionStorage.setItem('admin_token', token);
                setIsAdmin(true);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const logout = () => {
        sessionStorage.removeItem('admin_token');
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
