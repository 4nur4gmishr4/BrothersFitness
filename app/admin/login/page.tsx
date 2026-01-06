"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </button>

                {/* Login Card */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-lg">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gym-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-gym-red" />
                        </div>
                        <h1 className="text-2xl font-black uppercase">Admin Access</h1>
                        <p className="text-gray-400 text-sm mt-2">Authorized personnel only</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Admin Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="w-full bg-black border border-white/20 rounded-lg py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-gym-red"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/20 border border-red-500/50 text-red-400 text-sm p-3 rounded"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full bg-gym-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
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

                    <p className="text-center text-gray-500 text-xs mt-6">
                        This area is restricted to gym administrators only.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
