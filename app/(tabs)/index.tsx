import { UbarColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Service suggestions ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    id: '1',
    label: 'Send Items',
    badge: '30%',
    badgeType: 'discount',
    icon: 'package-variant',
    iconLib: 'material',
  },
  {
    id: '2',
    label: 'Ride',
    badge: '30%',
    badgeType: 'discount',
    icon: 'car',
    iconLib: 'material',
  },
  {
    id: '3',
    label: 'Reserve',
    badge: 'Promo',
    badgeType: 'promo',
    icon: 'clock-time-four',
    iconLib: 'material',
  },
  {
    id: '4',
    label: 'Store Pickup',
    badge: null,
    badgeType: null,
    icon: 'store',
    iconLib: 'material',
  },
];

// ── More ways cards ──────────────────────────────────────────────────────────
const MORE_WAYS = [
  {
    id: '1',
    title: 'Try Courier',
    subtitle: 'For the things you need done now',
    image: require('@/assets/images/courier_card.png'),
  },
  {
    id: '2',
    title: 'Safety Toolkit',
    subtitle: 'On-trip help with a tap',
    image: require('@/assets/images/safety_card.png'),
  },
];

// ── Animated card pill ───────────────────────────────────────────────────────
function ServiceCard({ item }: { item: (typeof SUGGESTIONS)[0] }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.serviceCard, { transform: [{ scale }] }]}>
        {/* badge */}
        {item.badge && (
          <View
            style={[
              styles.badge,
              item.badgeType === 'promo' ? styles.badgePromo : styles.badgeDiscount,
            ]}>
            {item.badgeType === 'discount' && (
              <Ionicons name="pricetag" size={9} color="#fff" style={{ marginRight: 1 }} />
            )}
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {/* icon box */}
        <View style={styles.serviceIconBox}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={36}
            color={UbarColors.textPrimary}
          />
        </View>
        <Text style={styles.serviceLabel}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── More-ways card ────────────────────────────────────────────────────────────
function WayCard({ item }: { item: (typeof MORE_WAYS)[0] }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.wayCard, { transform: [{ scale }] }]}>
        <Image source={item.image} style={styles.wayCardImage} resizeMode="cover" />
        <View style={styles.wayCardOverlay} />
        <View style={styles.wayCardText}>
          <Text style={styles.wayCardTitle}>{item.title}</Text>
          <Text style={styles.wayCardSubtitle}>{item.subtitle}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Top tab (Ubar / Courier) ──────────────────────────────────────────────────
function TopTabs({
  active,
  setActive,
}: {
  active: string;
  setActive: (v: string) => void;
}) {
  return (
    <View style={styles.topTabs}>
      <TouchableOpacity style={styles.topTab} onPress={() => setActive('ubar')}>
        <Ionicons
          name="car-sport"
          size={20}
          color={active === 'ubar' ? UbarColors.black : UbarColors.tabInactive}
        />
        <Text
          style={[
            styles.topTabText,
            active === 'ubar' && styles.topTabTextActive,
          ]}>
          Ubar
        </Text>
        {active === 'ubar' && <View style={styles.topTabIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity style={styles.topTab} onPress={() => setActive('courier')}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={20}
          color={active === 'courier' ? UbarColors.black : UbarColors.tabInactive}
        />
        <Text
          style={[
            styles.topTabText,
            active === 'courier' && styles.topTabTextActive,
          ]}>
          Courier
        </Text>
        {active === 'courier' && <View style={styles.topTabIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('ubar');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={UbarColors.white} />

      {/* ─── FIXED HEADER ─── */}
      <View style={styles.header}>
        <TopTabs active={activeTab} setActive={setActiveTab} />

        {/* Search bar — tapping opens Plan Ride screen */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => router.push('/plan-ride')}>
            <Ionicons name="search" size={20} color={UbarColors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.searchInput}>Where to?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn}>
            <Ionicons name="calendar-outline" size={16} color={UbarColors.textPrimary} />
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── SCROLLABLE BODY ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Suggestions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          <TouchableOpacity style={styles.arrowBtn}>
            <Ionicons name="arrow-forward" size={18} color={UbarColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsRow}>
          {SUGGESTIONS.map((item) => (
            <ServiceCard key={item.id} item={item} />
          ))}
        </ScrollView>

        {/* More ways */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More ways to use Ubar</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wayCardsRow}>
          {MORE_WAYS.map((item) => (
            <WayCard key={item.id} item={item} />
          ))}
        </ScrollView>

        {/* Bottom spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: UbarColors.white,
  },

  // ── Header ──
  header: {
    backgroundColor: UbarColors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: UbarColors.border,
  },

  // ── Top tabs ──
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 14,
    gap: 32,
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    gap: 6,
    position: 'relative',
  },
  topTabText: {
    fontSize: 18,
    fontWeight: '500',
    color: UbarColors.tabInactive,
  },
  topTabTextActive: {
    color: UbarColors.black,
    fontWeight: '700',
  },
  topTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: UbarColors.black,
    borderRadius: 2,
  },

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UbarColors.white,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: UbarColors.textPrimary,
  },
  laterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: UbarColors.white,
  },
  laterText: {
    fontSize: 14,
    fontWeight: '600',
    color: UbarColors.textPrimary,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
    backgroundColor: UbarColors.background,
  },
  scrollContent: {
    paddingTop: 16,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: UbarColors.textPrimary,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UbarColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UbarColors.border,
  },

  // ── Service cards ──
  suggestionsRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: 90,
    alignItems: 'center',
    position: 'relative',
  },
  serviceIconBox: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: UbarColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: UbarColors.textPrimary,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  badgeDiscount: {
    backgroundColor: UbarColors.badgeRed,
  },
  badgePromo: {
    backgroundColor: UbarColors.badgeRed,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Way cards ──
  wayCardsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  wayCard: {
    width: SCREEN_WIDTH * 0.58,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: UbarColors.cardBg,
  },
  wayCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  wayCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  wayCardText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  wayCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  wayCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
});
