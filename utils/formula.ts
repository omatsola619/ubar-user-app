export interface RidePricingParams {
    distanceKm: number;
    durationMin: number;
    surgeMultiplier?: number;
}

const RIDE_RATES = {
    Priority: { baseFare: 5.00, perKm: 1.80, perMin: 0.35 },
    UberX: { baseFare: 3.50, perKm: 1.20, perMin: 0.25 },
    Courier: { baseFare: 3.00, perKm: 1.10, perMin: 0.20 },
    'Courier Bike': { baseFare: 2.00, perKm: 0.80, perMin: 0.15 },
};

/**
 * Calculates the mock price formatted as a string (e.g., "NGN 1,500.00")
 */
export function calculateRidePrice(rideType: keyof typeof RIDE_RATES, params: RidePricingParams): string {
    const rates = RIDE_RATES[rideType];
    const { distanceKm, durationMin, surgeMultiplier = 1 } = params;

    // Standard Uber-like math: Base + (Distance * Rate) + (Time * Rate)
    const baseTotal = rates.baseFare + (distanceKm * rates.perKm) + (durationMin * rates.perMin);

    // Apply surge pricing if any
    const finalTotal = baseTotal * surgeMultiplier;

    // Format the number to standard US Dollar formatting
    return `$${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates arrival time given duration in minutes
 */
export function calculateArrivalTime(durationMin: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + Math.ceil(durationMin));

    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
