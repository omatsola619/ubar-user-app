import { UbarColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityScreen() {
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activity</Text>
            </View>
            <View style={styles.center}>
                <Ionicons name="receipt-outline" size={64} color={UbarColors.border} />
                <Text style={styles.emptyTitle}>No Recent Activity</Text>
                <Text style={styles.emptySubtitle}>Your trips and orders will appear here</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: UbarColors.white },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: UbarColors.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: UbarColors.textPrimary,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: UbarColors.textSecondary,
    },
});
