import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper: check if current (hash) location is on the login page
    const isOnLoginPage = () => {
        const hash = window.location.hash; // e.g. "" or "#/" or "#/admin"
        return !hash || hash === '#' || hash === '#/';
    };

    useEffect(() => {
        // Safety timeout: if Supabase hangs (e.g. no network on first boot), stop blocking after 5s
        const timeout = setTimeout(() => setLoading(false), 5000);

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            if (session?.user) {
                loadUserProfile(session.user);
            } else {
                setLoading(false);
                // With HashRouter, use hash to check location
                if (!isOnLoginPage()) {
                    window.location.hash = '/';
                }
            }
        }).catch(() => {
            clearTimeout(timeout);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth event:', event);

            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                console.log('⏰ Session expired or signed out - redirecting to login');
                setUser(null);
                setLoading(false);
                if (!isOnLoginPage()) {
                    window.location.hash = '/';
                }
                return;
            }

            if (session?.user) {
                loadUserProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
                if (!isOnLoginPage()) {
                    window.location.hash = '/';
                }
            }
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const loadUserProfile = async (authUser: SupabaseUser) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) throw error;

            // Only allow admin users
            if (data.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error('Acesso negado. Apenas administradores podem acessar.');
            }

            setUser({
                id: data.id,
                name: data.full_name,
                email: data.email,
                avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
                role: data.role
            });
        } catch (error) {
            console.error('Error loading user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(error.message);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const isAdmin = user?.role === "admin";

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

