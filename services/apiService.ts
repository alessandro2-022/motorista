import { DriverProfile, Ride, Transaction, Trip } from '../types';

// =================================================================
// MOCK BACKEND DATA
// In a real application, this data would live in a database.
// The functions below simulate fetching this data from an API.
// =================================================================

const mockProfile: DriverProfile = {
    name: 'John Doe',
    avatarUrl: 'https://picsum.photos/seed/driver/200',
    rating: 4.9,
    totalRides: 1254,
    memberSince: '2022-01-01',
};

const mockTransactions: Transaction[] = [
    { id: '1', description: 'Tarifa da Corrida', amount: 15.50, type: 'earning', timestamp: '10:30' },
    { id: '2', description: 'Gorjeta do Passageiro', amount: 3.00, type: 'tip', timestamp: '10:30' },
    { id: '3', description: 'Tarifa da Corrida', amount: 22.75, type: 'earning', timestamp: '09:15' },
    { id: '4', description: 'Tarifa da Corrida', amount: 8.20, type: 'earning', timestamp: '08:40' },
    { id: '5', description: 'Pagamento Semanal', amount: -350.00, type: 'withdrawal', timestamp: 'Ontem' },
];

const mockRides: Ride[] = [
    { id: '1', date: '2023-10-27', passengerName: 'Alice', passengerAvatarUrl: 'https://picsum.photos/seed/p1/100', pickup: 'Rua Principal, 123', dropoff: 'Avenida Carvalho, 456', fare: 15.50, paymentMethod: 'Credit Card' },
    { id: '2', date: '2023-10-27', passengerName: 'Bob', passengerAvatarUrl: 'https://picsum.photos/seed/p2/100', pickup: 'Alameda dos Pinheiros, 789', dropoff: 'Travessa Bordo, 101', fare: 22.75, paymentMethod: 'Credit Card' },
    { id: '3', date: '2023-10-26', passengerName: 'Charlie', passengerAvatarUrl: 'https://picsum.photos/seed/p3/100', pickup: 'Rua do Olmo, 222', dropoff: 'Estrada da Bétula, 333', fare: 8.20, paymentMethod: 'Cash' },
];

const mockTripData: Trip = {
    passengerName: 'Ana',
    dropoffAddress: 'Avenida Paulista, 1578',
    route: [
        [-23.5505, -46.6333], [-23.5512, -46.6345], [-23.5520, -46.6358], 
        [-23.5531, -46.6372], [-23.5543, -46.6389], [-23.5555, -46.6410],
        [-23.5568, -46.6431], [-23.5580, -46.6455], [-23.5595, -46.6480],
        [-23.5608, -46.6510], [-23.5615, -46.6540], [-23.5613, -46.6564]
    ]
};


// =================================================================
// API SERVICE FUNCTIONS
// These functions simulate making network requests to a backend API.
// =================================================================

const api = {
  get: <T>(path: string, mockData: T): Promise<T> => {
    console.log(`[API MOCK] GET: ${path}`);
    return new Promise((resolve, reject) => {
      // Simulate network latency
      setTimeout(() => {
        // Simulate a chance of a network error
        if (Math.random() < 0.05) { // 5% chance of error
          reject(new Error(`Failed to fetch ${path}`));
        } else {
          resolve(mockData);
        }
      }, 500 + Math.random() * 1000); // Latency between 0.5s and 1.5s
    });
  },
  // In a real app, you would have post, put, delete methods here as well.
  // post: (path, data) => { ... }
};

export const getDriverProfile = (): Promise<DriverProfile> => {
    return api.get<DriverProfile>('/api/driver/profile', mockProfile);
};

export const getTransactions = (): Promise<Transaction[]> => {
    return api.get<Transaction[]>('/api/driver/transactions', mockTransactions);
};

export const getRideHistory = (): Promise<Ride[]> => {
    return api.get<Ride[]>('/api/driver/rides', mockRides);
};

export const getMockTrip = (): Promise<Trip> => {
    // In a real app, this would come from a WebSocket push or a specific API call to accept a ride.
    return api.get<Trip>('/api/rides/new', mockTripData);
};
