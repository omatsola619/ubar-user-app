import { UbarColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const MENU_ITEMS = [
    { id: '1', label: 'Help', icon: 'help-circle-outline' },
    { id: '2', label: 'Wallet', icon: 'wallet-outline' },
    { id: '3', label: 'Settings', icon: 'settings-outline' },
    { id: '4', label: 'Privacy', icon: 'shield-checkmark-outline' },
];

export default function AccountScreen() {
    const { user, signOut } = useAuth();
    const [userType, setUserType] = useState<string>('Loading...');
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        // Fetch the userType we saved to AsyncStorage during login/signup
        const fetchUserData = async () => {
            try {
                const type = await AsyncStorage.getItem('userType');
                setUserType(type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Rider');
            } catch (e) {
                setUserType('Rider');
            }
        };
        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
        // The router redirect is handled automatically by the InitialLayout in _layout.tsx
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account</Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={UbarColors.white} />
                </View>
                <Text style={styles.userName}>{user?.email ? user.email.split('@')[0] : 'Ubar User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@ubar.app'}</Text>
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{userType}</Text>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.menu}>
                {MENU_ITEMS.map((item, idx) => (
                    <TouchableOpacity key={item.id} style={styles.menuRow} activeOpacity={0.7}>
                        <Ionicons name={item.icon as any} size={22} color={UbarColors.textPrimary} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={18} color={UbarColors.textMuted} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                ))}

                {/* Sign Out Button */}
                <TouchableOpacity
                    style={[styles.menuRow, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <ActivityIndicator color={UbarColors.badgeRed || '#FF3B30'} size="small" />
                    ) : (
                        <Ionicons name="log-out-outline" size={22} color={UbarColors.badgeRed || '#FF3B30'} />
                    )}
                    <Text style={[styles.menuLabel, { color: UbarColors.badgeRed || '#FF3B30' }]}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: UbarColors.background },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: UbarColors.white,
        borderBottomWidth: 1,
        borderBottomColor: UbarColors.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 28,
        backgroundColor: UbarColors.white,
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: UbarColors.black,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    userEmail: {
        fontSize: 13,
        color: UbarColors.textSecondary,
        marginTop: 4,
    },
    badgeContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#F3F3F3',
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: UbarColors.textPrimary,
    },
    menu: {
        backgroundColor: UbarColors.white,
        marginHorizontal: 16,
        borderRadius: 14,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: UbarColors.border,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: UbarColors.textPrimary,
    },
});
