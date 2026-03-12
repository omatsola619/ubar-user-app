import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    initialized: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    initialized: false,
    signOut: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        // A fallback timeout just in case AsyncStorage or Supabase hang completely
        const failsafe = setTimeout(() => {
            if (isMounted && !initialized) {
                setInitialized(true);
            }
        }, 3000);

        const checkSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (isMounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setInitialized(true);
                    clearTimeout(failsafe);
                }
            } catch (error) {
                console.warn('AuthContext getSession error:', error);
                if (isMounted) {
                    setInitialized(true);
                    clearTimeout(failsafe);
                }
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!isMounted) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Store custom user data to AsyncStorage directly to communicate values simply
                if (event === 'SIGNED_IN' && currentSession?.user) {
                    try {
                        await AsyncStorage.setItem('lastLoginTime', new Date().toISOString());
                        if (currentSession.user.user_metadata?.user_type) {
                            await AsyncStorage.setItem('userType', currentSession.user.user_metadata.user_type);
                        }
                    } catch (e) {
                        console.warn('AsyncStorage setItem failed on sign in', e);
                    }
                }

                if (event === 'SIGNED_OUT') {
                    try {
                        await AsyncStorage.removeItem('userType');
                        await AsyncStorage.removeItem('lastLoginTime');
                    } catch (e) { }
                }
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(failsafe);
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, initialized, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
