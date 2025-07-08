import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success('წარმატებით გაიარეთ ავტორიზაცია!');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success('რეგისტრაცია წარმატებულია! გთხოვთ, შეამოწმოთ მეილი ვერიფიკაციისთვის.');
            }
        } catch (error: any) {
            toast.error(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-background text-text-main">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">QEMXA</h1>
                    <p className="text-text-light mt-2">თქვენი AI ავტო-დიაგნოსტიკის ასისტენტი</p>
                </div>

                <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-center text-text-main mb-1">
                        {isLogin ? 'ავტორიზაცია' : 'რეგისტრაცია'}
                    </h2>
                    <p className="text-center text-text-dim mb-6 text-sm">
                        {isLogin ? 'გააგრძელეთ თქვენს ანგარიშთან მუშაობა' : 'შექმენით ანგარიში და დაიწყეთ'}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-text-light block mb-2">
                                იმეილი
                            </label>
                            <input
                                id="email"
                                className="w-full p-3 bg-background border border-secondary rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="text-sm font-medium text-text-light block mb-2">
                                პაროლი
                            </label>
                            <input
                                id="password"
                                className="w-full p-3 bg-background border border-secondary rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full p-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover disabled:bg-gray-500 transition-colors"
                                disabled={loading}
                            >
                                {loading ? (isLogin ? 'შესვლა...' : 'რეგისტრაცია...') : (isLogin ? 'შესვლა' : 'რეგისტრაცია')}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            {isLogin ? 'არ გაქვთ ანგარიში? შექმენით' : 'უკვე გაქვთ ანგარიში? შედით'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;