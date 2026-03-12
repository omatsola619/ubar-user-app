import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Create a safe adapter that won't completely crash if AsyncStorage is unavailable
const safeAsyncStorage = {
    getItem: async (key: string) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.warn('AsyncStorage get failed', e);
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.warn('AsyncStorage set failed', e);
        }
    },
    removeItem: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.warn('AsyncStorage remove failed', e);
        }
    },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: safeAsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
