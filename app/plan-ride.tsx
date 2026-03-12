import { UbarColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
    distance_meters?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDistance(meters?: number): string {
    if (!meters) return '';
    const km = meters / 1000;
    return km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}&result_type=street_address|premise|route`
        );
        const data = await res.json();
        if (data.results?.length > 0) {
            return data.results[0].formatted_address;
        }
    } catch (_) { }
    return 'Current Location';
}

async function fetchPredictions(
    input: string,
    lat?: number,
    lng?: number
): Promise<PlacePrediction[]> {
    if (input.trim().length < 2) return [];
    const locationBias =
        lat && lng ? `&location=${lat},${lng}&radius=50000` : '';
    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                input
            )}&key=${MAPS_KEY}&language=en${locationBias}`
        );
        const data = await res.json();
        return data.predictions ?? [];
    } catch (_) {
        return [];
    }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FilterPill({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <TouchableOpacity style={styles.filterPill} activeOpacity={0.75}>
            {icon}
            <Text style={styles.filterPillText}>{label}</Text>
            <Ionicons name="chevron-down" size={14} color={UbarColors.textPrimary} />
        </TouchableOpacity>
    );
}

function ActionRow({
    icon,
    label,
    onPress,
}: {
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.actionIconBox}>{icon}</View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let cachedAddress: string | null = null;
let cachedCoords: { lat: number; lng: number } | null = null;

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PlanRideScreen() {
    const [currentAddress, setCurrentAddress] = useState(cachedAddress ?? 'Fetching location…');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(cachedCoords);
    const [destination, setDestination] = useState('');
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(!cachedAddress);
    const [loadingPredictions, setLoadingPredictions] = useState(false);

    const destinationRef = useRef<TextInput>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Get current location ──────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            if (cachedAddress && cachedCoords) {
                return;
            }
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setCurrentAddress('Location permission denied');
                    setLoadingLocation(false);
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const { latitude, longitude } = loc.coords;
                setCurrentCoords({ lat: latitude, lng: longitude });
                cachedCoords = { lat: latitude, lng: longitude };

                const address = await reverseGeocode(latitude, longitude);
                setCurrentAddress(address);
                cachedAddress = address;
            } catch (e) {
                setCurrentAddress('Unable to get location');
            } finally {
                setLoadingLocation(false);
            }
        })();
        // auto-focus destination
        setTimeout(() => destinationRef.current?.focus(), 300);
    }, []);

    // ── Autocomplete ──────────────────────────────────────────────────────────
    const onDestinationChange = useCallback(
        (text: string) => {
            setDestination(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (text.trim().length < 2) {
                setPredictions([]);
                return;
            }
            setLoadingPredictions(true);
            debounceRef.current = setTimeout(async () => {
                const results = await fetchPredictions(text, currentCoords?.lat, currentCoords?.lng);
                setPredictions(results);
                setLoadingPredictions(false);
            }, 350);
        },
        [currentCoords]
    );

    const onSelectPlace = (place: PlacePrediction) => {
        Keyboard.dismiss();
        setDestination(place.description);
        setPredictions([]);

        router.push({
            pathname: '/choose-ride',
            params: {
                destId: place.place_id,
                destDescription: place.structured_formatting.main_text ?? place.description,
                originLat: currentCoords?.lat,
                originLng: currentCoords?.lng,
                originAddress: currentAddress,
            }
        });
    };

    // ── Render prediction item ────────────────────────────────────────────────
    const renderPrediction = ({ item }: { item: PlacePrediction }) => (
        <TouchableOpacity
            style={styles.predictionRow}
            activeOpacity={0.7}
            onPress={() => onSelectPlace(item)}>
            <View style={styles.predIconBox}>
                <Ionicons name="time-outline" size={20} color={UbarColors.textSecondary} />
            </View>
            <View style={styles.predText}>
                <Text style={styles.predMain} numberOfLines={1}>
                    {item.structured_formatting?.main_text ?? item.description}
                </Text>
                <Text style={styles.predSub} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text ?? ''}
                </Text>
            </View>
            {item.distance_meters != null && (
                <Text style={styles.predDistance}>{formatDistance(item.distance_meters)}</Text>
            )}
        </TouchableOpacity>
    );

    const showActions = predictions.length === 0 && !loadingPredictions;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar style="dark" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={UbarColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plan your ride</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ── Filter pills ── */}
            <View style={styles.filtersRow}>
                <FilterPill
                    icon={<Ionicons name="time-outline" size={15} color={UbarColors.textPrimary} style={{ marginRight: 4 }} />}
                    label="Pickup now"
                />
                <FilterPill
                    icon={<Ionicons name="person-outline" size={15} color={UbarColors.textPrimary} style={{ marginRight: 4 }} />}
                    label="For me"
                />
            </View>

            {/* ── Location input card ── */}
            <View style={styles.locationCard}>
                {/* From */}
                <View style={styles.locationRow}>
                    <View style={styles.fromDot} />
                    {loadingLocation ? (
                        <ActivityIndicator size="small" color={UbarColors.textMuted} style={{ marginLeft: 12 }} />
                    ) : (
                        <Text style={styles.fromText} numberOfLines={1}>
                            {currentAddress}
                        </Text>
                    )}
                </View>

                {/* Connector line */}
                <View style={styles.connectorLine} />

                {/* To */}
                <View style={styles.locationRow}>
                    <View style={styles.toDot} />
                    <TextInput
                        ref={destinationRef}
                        style={styles.destinationInput}
                        placeholder="Where to?"
                        placeholderTextColor={UbarColors.textMuted}
                        value={destination}
                        onChangeText={onDestinationChange}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {destination.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setDestination('');
                                setPredictions([]);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={18} color={UbarColors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Add stop button */}
                <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.75}>
                    <Ionicons name="add" size={22} color={UbarColors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* ── Results / Actions ── */}
            {loadingPredictions && (
                <ActivityIndicator
                    size="small"
                    color={UbarColors.textMuted}
                    style={{ marginTop: 20 }}
                />
            )}

            {predictions.length > 0 && (
                <FlatList
                    data={predictions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={renderPrediction}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    style={styles.predictionList}
                />
            )}

            {showActions && (
                <View style={styles.actionsSection}>
                    <ActionRow
                        icon={<Ionicons name="earth-outline" size={22} color={UbarColors.textPrimary} />}
                        label="Search in a different city"
                    />
                    <View style={styles.separator} />
                    <ActionRow
                        icon={<Ionicons name="location-outline" size={22} color={UbarColors.textPrimary} />}
                        label="Set location on map"
                    />
                    <View style={styles.separator} />
                    <ActionRow
                        icon={<Ionicons name="star-outline" size={22} color={UbarColors.textPrimary} />}
                        label="Saved places"
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: UbarColors.white,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },

    // Filter pills
    filtersRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#DADADD',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
        backgroundColor: UbarColors.white,
    },
    filterPillText: {
        fontSize: 13,
        fontWeight: '500',
        color: UbarColors.textPrimary,
    },

    // Location card
    locationCard: {
        marginHorizontal: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: UbarColors.black,
        padding: 14,
        paddingRight: 52,       // room for add button
        backgroundColor: UbarColors.white,
        position: 'relative',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 32,
    },

    // From dot (filled circle)
    fromDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: UbarColors.black,
        marginRight: 12,
        flexShrink: 0,
    },
    fromText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: UbarColors.textPrimary,
    },

    // Connector line
    connectorLine: {
        width: 1.5,
        height: 18,
        backgroundColor: '#C0C0C0',
        marginLeft: 4,
        marginVertical: 4,
    },

    // To dot (rounded square / destination)
    toDot: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: UbarColors.black,
        marginRight: 12,
        flexShrink: 0,
    },
    destinationInput: {
        flex: 1,
        fontSize: 15,
        color: UbarColors.textPrimary,
        paddingVertical: 0,
    },

    // Add stop
    addStopBtn: {
        position: 'absolute',
        right: 12,
        top: '50%',
        marginTop: -18,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#DADADD',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: UbarColors.white,
    },

    // Predictions
    predictionList: {
        flex: 1,
    },
    predictionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    predIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: UbarColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    predText: {
        flex: 1,
    },
    predMain: {
        fontSize: 14,
        fontWeight: '600',
        color: UbarColors.textPrimary,
    },
    predSub: {
        fontSize: 12,
        color: UbarColors.textSecondary,
        marginTop: 2,
    },
    predDistance: {
        fontSize: 12,
        color: UbarColors.textMuted,
        marginLeft: 8,
    },

    // Actions
    actionsSection: {
        paddingHorizontal: 0,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 16,
    },
    actionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: UbarColors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: UbarColors.textPrimary,
    },

    // Shared
    separator: {
        height: 1,
        backgroundColor: UbarColors.border,
        marginLeft: 72,
    },
});
