import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Sign In Error', error.message);
        }
        // Routing is handled automatically by AuthContext

        setLoading(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (router.canGoBack()) router.back();
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>What's your email?</Text>
                    <Text style={styles.subtitle}>Enter your email to log in</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="name@example.com"
                            placeholderTextColor="#A0A0A0"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#A0A0A0"
                            secureTextEntry
                            autoCapitalize="none"
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Continue</Text>
                        )}
                        {!loading && (
                            <Ionicons
                                name="arrow-forward"
                                size={20}
                                color="white"
                                style={styles.buttonIcon}
                            />
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <Link href="/signup" asChild>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Create an account</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    backButton: {
        padding: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 32,
    },
    inputContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
    },
    input: {
        fontSize: 18,
        color: '#000000',
    },
    button: {
        backgroundColor: '#000000',
        borderRadius: 8,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    buttonIcon: {
        position: 'absolute',
        right: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E8E8',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#666666',
        fontSize: 14,
    },
    secondaryButton: {
        backgroundColor: '#F3F3F3',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
});
