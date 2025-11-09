
export interface DriverProfile {
  name: string;
  avatarUrl: string;
  rating: number;
  totalRides: number;
  memberSince: string;
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
}

export interface Trip {
    passengerName: string;
    dropoffAddress: string;
    route: [number, number][];
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'earning' | 'tip' | 'withdrawal';
    timestamp: string;
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
    MAP = 'MAP',
    PROFILE = 'PROFILE',
    BALANCE = 'BALANCE',
    HISTORY = 'HISTORY',
    CHAT = 'CHAT'
}