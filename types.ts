

export interface DriverProfile {
  name: string;
  avatarUrl: string;
  rating: number;
  totalRides: number;
  memberSince: string;
  status: DriverStatus; // Added driver status
}

export enum DriverStatus {
    PENDING_ONBOARDING = 'PENDING_ONBOARDING',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface Ride {
  id: string;
  date: string;
  passengerName: string;
  passengerAvatarUrl: string;
  pickup: string;
  dropoff: string;
  fare: number;
  paymentMethod: 'Credit Card' | 'Cash';
  estimatedDuration?: string; // New: estimated duration
  distanceToPassenger?: string; // New: distance to passenger
}

export interface Trip {
    passengerName: string;
    passengerAvatarUrl: string; // Added for trip requests
    pickupAddress: string;       // Added for trip requests
    dropoffAddress: string;
    fare: number;                // Added for trip requests
    estimatedDuration: string;   // Added for trip requests
    distanceToPassenger: string; // Added for trip requests
    route: [number, number][];
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'earning' | 'tip' | 'withdrawal' | 'bonus'; // Added 'bonus' type
    timestamp: string; // Changed to full Date string for accurate daily filtering
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    sources?: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
    type: 'web' | 'maps';
}

export enum AppView {
    LOGIN = 'LOGIN', // New: Login screen
    REGISTER = 'REGISTER', // New: Registration screen
    ONBOARDING = 'ONBOARDING', // New onboarding screen
    MAP = 'MAP',
    PROFILE = 'PROFILE',
    BALANCE = 'BALANCE',
    HISTORY = 'HISTORY',
    CHAT = 'CHAT'
}

export enum TripStage {
    SEARCHING = 'SEARCHING',
    TRIP_REQUEST = 'TRIP_REQUEST', // New: for displaying incoming ride request
    EN_ROUTE_TO_PASSENGER = 'EN_ROUTE_TO_PASSENGER',
    ARRIVED_AT_PASSENGER = 'ARRIVED_AT_PASSENGER',
    EN_ROUTE_TO_DROPOFF = 'EN_ROUTE_TO_DROPOFF',
    COMPLETED = 'COMPLETED',
    RATING_PASSENGER = 'RATING_PASSENGER' // New: for passenger rating after trip
}

export interface DriverRegistrationData {
    fullName: string;
    cnhNumber: string;
    crlvNumber: string;
    vehiclePlate: string;
    bankAccount: string;
    pixKey: string;
    cnhPhoto: File | null;
    crlvPhoto: File | null;
    vehiclePhoto: File | null;
    selfiePhoto: File | null;
    userEmail: string; // Added to link onboarding data to user
}
