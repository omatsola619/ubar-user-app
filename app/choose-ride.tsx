import { UbarColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateArrivalTime, calculateRidePrice } from '@/utils/formula';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY ?? '';

const UBER_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
];

const RIDES_CONFIG = [
    {
        id: '1',
        name: 'Priority' as const,
        capacity: 4,
        badge: 'Faster',
        image: require('@/assets/images/ride_car.png'),
        surge: 1.15,
        icon: 'flash' as const,
    },
    {
        id: '2',
        name: 'UberX' as const,
        capacity: 4,
        badge: null,
        image: require('@/assets/images/ride_car.png'),
        surge: 1,
    },
    {
        id: '3',
        name: 'Courier' as const,
        capacity: null,
        badge: null,
        image: require('@/assets/images/ride_courier.png'),
        surge: 0.7, // Discounted for example
    },
    {
        id: '4',
        name: 'Wait & Save' as const,
        capacity: 4,
        badge: null,
        image: require('@/assets/images/ride_car.png'),
        surge: 0.9,
        icon: 'time' as const,
    },
];

export default function ChooseRideScreen() {
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        destId: string;
        destDescription: string;
        originLat: string;
        originLng: string;
        originAddress: string;
    }>();

    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [selectedRideId, setSelectedRideId] = useState('1');
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [currentRideId, setCurrentRideId] = useState<string | null>(null);

    const origin = useMemo(() => ({
        latitude: params.originLat ? parseFloat(params.originLat) : 6.5244,
        longitude: params.originLng ? parseFloat(params.originLng) : 3.3792,
    }), [params.originLat, params.originLng]);

    const destinationInput = params.destId ? `place_id:${params.destId}` : params.destDescription ?? '';

    const selectedRide = useMemo(() => RIDES_CONFIG.find((r) => r.id === selectedRideId), [selectedRideId]);

    const handleConfirmRide = async () => {
        if (!user || !routeInfo || !selectedRide || !destinationCoords) return;

        setIsSearching(true);

        try {
            const baseDuration = Math.ceil(routeInfo.duration);
            const duration = selectedRide.name === 'Wait & Save' ? baseDuration + 5 : baseDuration;

            const { raw: priceValue } = calculateRidePrice(selectedRide.name as any, {
                distanceKm: routeInfo.distance,
                durationMin: duration,
                surgeMultiplier: selectedRide.surge,
            });

            // Prepare the payload as per requested schema
            const rideData = {
                rider_id: user.id,
                pickup_lat: origin.latitude,
                pickup_lng: origin.longitude,
                destination_lat: destinationCoords.latitude,
                destination_lng: destinationCoords.longitude,
                price: parseFloat(priceValue.toFixed(2)),
                distance_km: parseFloat(routeInfo.distance.toFixed(1)),
                status: 'searching',
                driver_id: null
            };

            const { data, error } = await supabase
                .from('rides')
                .insert([rideData])
                .select();

            if (error) {
                console.error('Error creating ride:', error);
                Alert.alert('Error', 'Failed to request ride. Please try again.');
                setIsSearching(false);
            } else if (data && data.length > 0) {
                setCurrentRideId(data[0].id);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setIsSearching(false);
        }
    };

    const handleCancelRide = async () => {
        setIsCancelling(true);
        if (currentRideId) {
            try {
                const { error } = await supabase
                    .from('rides')
                    .update({ status: 'cancelled' })
                    .eq('id', currentRideId);

                if (error) {
                    console.error('Error cancelling ride:', error);
                }
            } catch (err) {
                console.error('Unexpected error during cancellation:', err);
            }
        }
        setIsSearching(false);
        setIsCancelling(false);
        setCurrentRideId(null);
    };

    return (
        <View style={styles.container}>
            {/* ── MAP ── */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation
                mapType="standard"
                customMapStyle={UBER_MAP_STYLE}
                userInterfaceStyle="light"
            >
                <Marker coordinate={origin} title="Pickup" />

                {destinationInput && (
                    <MapViewDirections
                        origin={origin}
                        destination={destinationInput}
                        apikey={MAPS_KEY}
                        strokeWidth={4}
                        strokeColor={UbarColors.black}
                        onReady={(result) => {
                            setRouteInfo({ distance: result.distance, duration: result.duration });

                            // Capture the last coordinate as the destination
                            if (result.coordinates && result.coordinates.length > 0) {
                                const lastCoord = result.coordinates[result.coordinates.length - 1];
                                setDestinationCoords(lastCoord);
                            }

                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 120, right: 40, bottom: 400, left: 40 },
                                animated: true,
                            });
                        }}
                    />
                )}
            </MapView>

            {/* ── BACK BUTTON OVERLAY ── */}
            {!isSearching && (
                <View style={styles.overlayHeader}>
                    <TouchableOpacity style={styles.backCircleBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={UbarColors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.floatingDestination}>
                        <Text style={styles.floatingDestText} numberOfLines={1}>
                            {params.destDescription}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={UbarColors.black} />
                    </View>
                </View>
            )}

            {!isSearching && (
                <TouchableOpacity style={styles.recenterBtn} activeOpacity={0.8}>
                    <Ionicons name="locate" size={20} color={UbarColors.black} />
                </TouchableOpacity>
            )}

            {/* ── BOTTOM SHEET ── */}
            <BottomSheet
                ref={bottomSheetRef}
                index={1}
                snapPoints={isSearching ? ['35%'] : ['40%', '55%', '85%']}
                handleIndicatorStyle={styles.sheetHandle}
                backgroundStyle={styles.sheetBackground}
            >
                {isSearching ? (
                    <View style={styles.searchingContainer}>
                        <ActivityIndicator size="large" color={UbarColors.black} style={{ marginBottom: 20 }} />
                        <Text style={styles.searchingTitle}>{isCancelling ? 'cancelling ride request' : 'Searching for rides'}</Text>
                        <Text style={styles.searchingSub}>{isCancelling ? 'Please wait...' : 'Finding the best driver for you...'}</Text>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={handleCancelRide}
                            disabled={isCancelling}
                        >
                            <Text style={styles.cancelBtnText}>Cancel Request</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Choose a ride</Text>
                        </View>

                        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                            {!routeInfo ? (
                                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={UbarColors.black} />
                            ) : (
                                RIDES_CONFIG.map((ride) => {
                                    const isSelected = selectedRideId === ride.id;

                                    const baseDuration = Math.ceil(routeInfo.duration);
                                    const duration = ride.name === 'Wait & Save' ? baseDuration + 5 : baseDuration;

                                    const { formatted: price } = calculateRidePrice(ride.name as any, {
                                        distanceKm: routeInfo.distance,
                                        durationMin: duration,
                                        surgeMultiplier: ride.surge,
                                    });

                                    const isDiscounted = ride.surge < 1;
                                    const strikePrice = isDiscounted
                                        ? calculateRidePrice(ride.name as any, {
                                            distanceKm: routeInfo.distance,
                                            durationMin: duration,
                                            surgeMultiplier: 1.0,
                                        }).formatted
                                        : null;

                                    const arrivalTime = calculateArrivalTime(duration);
                                    const timeString = `${arrivalTime} · ${duration} min`;

                                    return (
                                        <TouchableOpacity
                                            key={ride.id}
                                            style={[styles.rideRow, isSelected && styles.rideRowSelected]}
                                            activeOpacity={1}
                                            onPress={() => setSelectedRideId(ride.id)}
                                        >
                                            <View style={styles.rideImgContainer}>
                                                {ride.icon && (
                                                    <Ionicons
                                                        name={ride.icon as any}
                                                        size={16}
                                                        color={UbarColors.black}
                                                        style={styles.rideTopLeftIcon}
                                                    />
                                                )}
                                                <Image source={ride.image} style={styles.rideImg} resizeMode="contain" />
                                            </View>

                                            <View style={styles.rideDetails}>
                                                <View style={styles.rideTitleRow}>
                                                    <Text style={styles.rideName}>{ride.name}</Text>
                                                    {ride.capacity && (
                                                        <View style={styles.capacityBox}>
                                                            <Ionicons name="person" size={12} color={UbarColors.black} />
                                                            <Text style={styles.capacityText}>{ride.capacity}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.rideTime}>{timeString}</Text>
                                                {ride.badge && (
                                                    <View style={styles.badgeBox}>
                                                        <Ionicons name="flash" size={12} color={UbarColors.white} />
                                                        <Text style={styles.badgeText}>{ride.badge}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.priceContainer}>
                                                <Text style={styles.ridePrice}>{price}</Text>
                                                {strikePrice && (
                                                    <Text style={styles.strikePrice}>{strikePrice}</Text>
                                                )}
                                                {isDiscounted && (
                                                    <Ionicons name="pricetag" size={14} color={UbarColors.badgeRed} style={styles.surgeIcon} />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}

                            <View style={{ height: 160 }} />
                        </BottomSheetScrollView>
                    </>
                )}
            </BottomSheet>

            {/* ── FOOTER ACTIONS ── */}
            {!isSearching && (
                <View style={styles.footerMain}>
                    <TouchableOpacity style={styles.paymentRow} activeOpacity={0.7}>
                        <Ionicons name="cash" size={24} color="#61A54F" />
                        <Text style={styles.paymentText}>Cash</Text>
                        <Ionicons name="chevron-forward" size={16} color={UbarColors.textSecondary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.confirmBtn}
                        activeOpacity={0.88}
                        onPress={handleConfirmRide}
                        disabled={!routeInfo}
                    >
                        <Text style={styles.confirmBtnText}>Choose {selectedRide?.name ?? 'Ride'}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    searchingTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: UbarColors.textPrimary,
        marginBottom: 8,
    },
    searchingSub: {
        fontSize: 16,
        color: UbarColors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: UbarColors.badgeRed,
    },

    // Overlay
    overlayHeader: {
        position: 'absolute',
        top: 54,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
        gap: 12,
    },
    backCircleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: UbarColors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    floatingDestination: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: UbarColors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    floatingDestText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: UbarColors.textPrimary,
    },
    recenterBtn: {
        position: 'absolute',
        right: 16,
        top: 154,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: UbarColors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        zIndex: 10,
    },

    // Sheet
    sheetHandle: {
        backgroundColor: '#E5E5E5',
        width: 48,
    },
    sheetBackground: {
        borderRadius: 24,
    },
    sheetHeader: {
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    // Ride Item
    rideRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        marginBottom: 8,
    },
    rideRowSelected: {
        borderColor: UbarColors.black,
        backgroundColor: '#F9F9F9',
    },
    rideImgContainer: {
        width: 70,
        height: 60,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rideImg: {
        width: '100%',
        height: '100%',
    },
    rideDetails: {
        flex: 1,
    },
    rideTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rideName: {
        fontSize: 18,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    capacityBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    capacityText: {
        fontSize: 12,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    rideTime: {
        fontSize: 14,
        color: UbarColors.textSecondary,
        marginTop: 2,
    },
    badgeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2E69FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
        gap: 4,
    },
    badgeText: {
        color: UbarColors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
    },
    ridePrice: {
        fontSize: 20,
        fontWeight: '700',
        color: UbarColors.textPrimary,
    },
    strikePrice: {
        fontSize: 13,
        color: '#888',
        textDecorationLine: 'line-through',
        marginTop: 2,
    },
    surgeIcon: {
        marginRight: 4,
    },
    rideTopLeftIcon: {
        position: 'absolute',
        top: -8,
        left: -8,
        zIndex: 1,
    },

    // Footer
    footerMain: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: UbarColors.white,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingBottom: 34,
        paddingTop: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    paymentText: {
        fontSize: 16,
        fontWeight: '600',
        color: UbarColors.textPrimary,
    },
    confirmBtn: {
        backgroundColor: UbarColors.black,
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: UbarColors.white,
    },
});
