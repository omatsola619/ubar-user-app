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

type UserType = 'user' | 'driver';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<UserType>('user');
    const [loading, setLoading] = useState(false);

    async function handleSignup() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    user_type: userType,
                },
            },
        });

        if (error) {
            Alert.alert('Sign Up Error', error.message);
        } else if (!data.session) {
            // Some supabase configurations require email confirmation
            Alert.alert('Success', 'Account created! You can now log in.');
            router.replace('/login');
        }

        // If data.session exists, AuthContext will automatically redirect to home
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
                    <Text style={styles.title}>Create an account</Text>
                    <Text style={styles.subtitle}>Sign up to join ubar</Text>

                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                userType === 'user' && styles.typeButtonActive,
                            ]}
                            onPress={() => setUserType('user')}
                        >
                            <Ionicons
                                name="person"
                                size={20}
                                color={userType === 'user' ? '#000' : '#666'}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    userType === 'user' && styles.typeTextActive,
                                ]}
                            >
                                Rider
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                userType === 'driver' && styles.typeButtonActive,
                            ]}
                            onPress={() => setUserType('driver')}
                        >
                            <Ionicons
                                name="car"
                                size={20}
                                color={userType === 'driver' ? '#000' : '#666'}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    userType === 'driver' && styles.typeTextActive,
                                ]}
                            >
                                Driver
                            </Text>
                        </TouchableOpacity>
                    </View>

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
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Sign up</Text>
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

                    <Link href="/login" asChild>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Log in instead</Text>
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
        marginBottom: 24,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F3F3',
        borderRadius: 8,
        padding: 4,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 6,
        gap: 8,
    },
    typeButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
    },
    typeTextActive: {
        color: '#000000',
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
