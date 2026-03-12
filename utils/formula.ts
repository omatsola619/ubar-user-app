export interface RidePricingParams {
    distanceKm: number;
    durationMin: number;
    surgeMultiplier?: number;
}

const RIDE_RATES = {
    Priority: { baseFare: 3000, perKm: 600, perMin: 120 },
    UberX: { baseFare: 2400, perKm: 550, perMin: 100 },
    'Wait & Save': { baseFare: 2200, perKm: 520, perMin: 93 },
    Courier: { baseFare: 1200, perKm: 200, perMin: 50 },
};

/**
 * Calculates the mock price formatted as a string (e.g., "NGN 1,500.00")
 */
export function calculateRidePrice(rideType: keyof typeof RIDE_RATES, params: RidePricingParams): { formatted: string; raw: number } {
    const rates = RIDE_RATES[rideType];
    const { distanceKm, durationMin, surgeMultiplier = 1 } = params;

    // Standard Uber-like math: Base + (Distance * Rate) + (Time * Rate)
    const baseTotal = rates.baseFare + (distanceKm * rates.perKm) + (durationMin * rates.perMin);

    // Apply surge pricing if any
    const finalTotal = baseTotal * surgeMultiplier;

    // Format to NGN (Naira) style: "NGN 10,800.00"
    const formatter = new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return {
        formatted: `NGN ${formatter.format(finalTotal)}`,
        raw: finalTotal
    };
}

/**
 * Calculates arrival time given duration in minutes
 */
export function calculateArrivalTime(durationMin: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + Math.ceil(durationMin));

    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
