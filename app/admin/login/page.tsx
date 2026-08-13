"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useAdmin } from '@/lib/auth-context';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAdmin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(password);
            if (success) {
                router.push('/admin/members');
            } else {
                setError('Invalid password. Access denied.');
            }
        } catch {
            setError('Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen surface-canvas text-hi flex items-center justify-center p-4 relative overflow-hidden">
            {/* Static grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    
                    backgroundSize: "80px 80px",
                }}
            />

            <div className="relative z-10 w-full max-w-md">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-mid hover:text-hi mb-8 transition-colors duration-fast"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="label-text">Back to Home</span>
                </button>

                {/* Login Card */}
                <div className="surface-card hairline p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 surface-modal hairline border-accent flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="heading-section text-2xl text-hi uppercase">Admin Access</h1>
                        <p className="label-text text-low mt-2">Authorized personnel only</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label-text text-mid block mb-2">
                                Admin Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-low" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="input-field pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-low hover:text-hi transition-colors duration-fast"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="surface-card hairline border-status-danger text-status-danger label-text p-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="btn-primary w-full"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Access Admin Panel
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-faint text-xs mt-6">
                        This area is restricted to gym administrators only.
                    </p>
                </div>
            </div>
        </div>
    );
}

