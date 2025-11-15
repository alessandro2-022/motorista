
import { DriverProfile, Ride, Transaction, Trip, DriverStatus, DriverRegistrationData } from '../types';

// =================================================================
// MOCK BACKEND DATA
// In a real application, this data would live in a database.
// The functions below simulate fetching this data from an API.
// =================================================================

// User-specific data storage keys
const getProfileKey = (email: string) => `driverProfile_${email}`;
const getDriverStatusKey = (email: string) => `driverStatus_${email}`;
const getUsersKey = () => `registeredUsers`;
const getTransactionsKey = (email: string) => `transactions_${email}`;
const getRidesKey = (email: string) => `rides_${email}`;
const getHeatmapKey = () => `heatmapData`;


// Mock initial data (can be updated for specific users)
const defaultMockProfile: DriverProfile = {
    name: 'Novo Motorista Goly',
    avatarUrl: 'https://picsum.photos/seed/defaultdriver/200',
    rating: 0,
    totalRides: 0,
    memberSince: new Date().toISOString().split('T')[0],
    status: DriverStatus.PENDING_ONBOARDING, // Default for new users
};

// Mock authentication functions
interface User {
    email: string;
    password: string;
    name?: string;
}

// --- INITIAL MOCK DATA ---
const initialMockTransactions: Transaction[] = [
    { id: '1', description: 'Tarifa da Corrida', amount: 15.50, type: 'earning', timestamp: new Date(new Date().setHours(10, 30, 0, 0)).toISOString() },
    { id: '2', description: 'Gorjeta do Passageiro', amount: 3.00, type: 'tip', timestamp: new Date(new Date().setHours(10, 30, 0, 0)).toISOString() },
    { id: '3', description: 'Bônus de Viagem', amount: 5.00, type: 'bonus', timestamp: new Date(new Date().setHours(9, 45, 0, 0)).toISOString() },
    { id: '4', description: 'Tarifa da Corrida', amount: 22.75, type: 'earning', timestamp: new Date(new Date().setHours(9, 15, 0, 0)).toISOString() },
    { id: '5', description: 'Tarifa da Corrida', amount: 8.20, type: 'earning', timestamp: new Date(new Date().setHours(8, 40, 0, 0)).toISOString() },
    { id: '6', description: 'Pagamento Semanal', amount: -350.00, type: 'withdrawal', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() }, // Yesterday
];

const initialMockRides: Ride[] = [
    { id: '1', date: '2023-10-27', passengerName: 'Alice', passengerAvatarUrl: 'https://picsum.photos/seed/p1/100', pickup: 'Rua Principal, 123', dropoff: 'Avenida Carvalho, 456', fare: 15.50, paymentMethod: 'Credit Card', estimatedDuration: '15 min', distanceToPassenger: '2.1 km' },
    { id: '2', date: '2023-10-27', passengerName: 'Bob', passengerAvatarUrl: 'https://picsum.photos/seed/p2/100', pickup: 'Alameda dos Pinheiros, 789', dropoff: 'Travessa Bordo, 101', fare: 22.75, paymentMethod: 'Credit Card', estimatedDuration: '20 min', distanceToPassenger: '1.5 km' },
    { id: '3', date: '2023-10-26', passengerName: 'Charlie', passengerAvatarUrl: 'https://picsum.photos/seed/p3/100', pickup: 'Rua do Olmo, 222', dropoff: 'Estrada da Bétula, 333', fare: 8.20, paymentMethod: 'Cash', estimatedDuration: '10 min', distanceToPassenger: '0.8 km' },
];

const initialMockTripData: Trip = {
    passengerName: 'Ana',
    passengerAvatarUrl: 'https://picsum.photos/seed/ana/100',
    pickupAddress: 'Rua Vergueiro, 1000',
    dropoffAddress: 'Avenida Paulista, 1578',
    fare: 28.50,
    estimatedDuration: '25 min',
    distanceToPassenger: '1.2 km',
    route: [
        [-23.5505, -46.6333], [-23.5512, -46.6345], [-23.5520, -46.6358], 
        [-23.5531, -46.6372], [-23.5543, -46.6389], [-23.5555, -46.6410],
        [-23.5568, -46.6431], [-23.5580, -46.6455], [-23.5595, -46.6480],
        [-23.5608, -46.6510], [-23.5615, -46.6540], [-23.5613, -46.6564]
    ]
};

const initialMockHeatmapData: [number, number, number][] = [
    [-23.550, -46.630, 0.8], // [lat, lng, intensity]
    [-23.555, -46.635, 0.5],
    [-23.548, -46.640, 0.9],
    [-23.560, -46.638, 0.6],
    [-23.553, -46.625, 0.7],
    [-23.545, -46.632, 0.4],
    [-23.565, -46.645, 0.7],
    [-23.540, -46.638, 0.8],
    [-23.558, -46.628, 0.5],
    [-23.562, -46.633, 0.9],
];

// --- LOCAL STORAGE HELPERS ---

// Function to ensure test user is always present and approved
const ensureTestUser = () => {
    const testEmail = 'test@goly.com';
    const testUser = { email: testEmail, password: 'password', name: 'Goly Test Driver' };
    const testUserProfile: DriverProfile = {
        name: 'Goly Test Driver',
        avatarUrl: 'https://picsum.photos/seed/golytest/200',
        rating: 5.0,
        totalRides: 5678,
        memberSince: '2021-06-15',
        status: DriverStatus.APPROVED,
    };

    // Ensure status is APPROVED
    localStorage.setItem(getDriverStatusKey(testEmail), DriverStatus.APPROVED);
    // Ensure profile is set
    localStorage.setItem(getProfileKey(testEmail), JSON.stringify(testUserProfile));
    // Ensure transactions exist
    if (!localStorage.getItem(getTransactionsKey(testEmail))) {
        localStorage.setItem(getTransactionsKey(testEmail), JSON.stringify(initialMockTransactions));
    }
    // Ensure rides exist
    if (!localStorage.getItem(getRidesKey(testEmail))) {
        localStorage.setItem(getRidesKey(testEmail), JSON.stringify(initialMockRides));
    }

    // Ensure test user's credentials are in the 'registeredUsers' list for login
    const usersJson = localStorage.getItem(getUsersKey());
    let users = usersJson ? JSON.parse(usersJson) : {};
    if (!users[testEmail] || users[testEmail].password !== testUser.password || users[testEmail].name !== testUser.name) {
        users[testEmail] = testUser;
        localStorage.setItem(getUsersKey(), JSON.stringify(users));
    }
};

// Call once to ensure test user is set up when apiService is loaded
ensureTestUser();

const getStoredUsers = (): { [email: string]: User } => {
    const usersJson = localStorage.getItem(getUsersKey());
    return usersJson ? JSON.parse(usersJson) : {};
};

const saveStoredUsers = (users: { [email: string]: User }) => {
    localStorage.setItem(getUsersKey(), JSON.stringify(users));
};

const getStoredTransactions = (email: string): Transaction[] => {
    const transactionsJson = localStorage.getItem(getTransactionsKey(email));
    return transactionsJson ? JSON.parse(transactionsJson) : [];
};

const saveStoredTransactions = (email: string, transactions: Transaction[]) => {
    localStorage.setItem(getTransactionsKey(email), JSON.stringify(transactions));
};

const getStoredRides = (email: string): Ride[] => {
    const ridesJson = localStorage.getItem(getRidesKey(email));
    return ridesJson ? JSON.parse(ridesJson) : [];
};

const saveStoredRides = (email: string, rides: Ride[]) => {
    localStorage.setItem(getRidesKey(email), JSON.stringify(rides));
};

const getStoredProfile = (email: string): DriverProfile | null => {
    const profileJson = localStorage.getItem(getProfileKey(email));
    return profileJson ? JSON.parse(profileJson) : null;
};

const saveStoredProfile = (email: string, profile: DriverProfile) => {
    localStorage.setItem(getProfileKey(email), JSON.stringify(profile));
};

// =================================================================
// API SERVICE FUNCTIONS (SIMULATED)
// =================================================================

const api = {
  get: <T>(path: string, mockData: T): Promise<T> => {
    console.log(`[API MOCK] GET: ${path}`);
    return new Promise((resolve) => {
      // Simulate minimal network latency
      setTimeout(() => {
        resolve(mockData);
      }, 100); 
    });
  },
  post: <T>(path: string, data: any, responseData: T): Promise<T> => {
    console.log(`[API MOCK] POST: ${path}`, data);
    return new Promise((resolve) => {
      // Simulate minimal network latency
      setTimeout(() => {
        resolve(responseData);
      }, 150);
    });
  }
};

export const registerUser = (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getStoredUsers();
            if (users[email]) {
                return reject(new Error('Email já registrado.'));
            }

            users[email] = { email, password, name };
            saveStoredUsers(users);

            // Initialize driver status for new user
            localStorage.setItem(getDriverStatusKey(email), DriverStatus.PENDING_ONBOARDING);
            // Initialize a basic profile
            const newProfile = { ...defaultMockProfile, name, status: DriverStatus.PENDING_ONBOARDING };
            saveStoredProfile(email, newProfile);
            // Initialize empty transactions and rides for new user
            saveStoredTransactions(email, []);
            saveStoredRides(email, []);

            resolve({ success: true, message: 'Registro bem-sucedido!' });
        }, 200);
    });
};

export const loginUser = (email: string, password: string): Promise<{ success: boolean; message: string; userEmail: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getStoredUsers();
            const user = users[email];

            if (!user || user.password !== password) {
                return reject(new Error('Email ou senha inválidos.'));
            }

            resolve({ success: true, message: 'Login bem-sucedido!', userEmail: email });
        }, 150);
    });
};

export const logoutUser = (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.removeItem('loggedInUserEmail'); // Clear current session
            resolve();
        }, 100);
    });
};


export const getDriverProfile = (userEmail: string): Promise<DriverProfile> => {
    const storedProfile = getStoredProfile(userEmail);
    if (storedProfile) {
        return api.get<DriverProfile>(`/api/driver/profile/${userEmail}`, storedProfile);
    }
    // Should not happen for test user due to ensureTestUser. For new users, defaultMockProfile is saved on register.
    const profileWithInitialStatus = { ...defaultMockProfile, status: DriverStatus.PENDING_ONBOARDING };
    return api.get<DriverProfile>(`/api/driver/profile/${userEmail}`, profileWithInitialStatus);
};

export const getDriverStatus = (userEmail: string): Promise<DriverStatus> => {
    const status = localStorage.getItem(getDriverStatusKey(userEmail)) as DriverStatus || DriverStatus.PENDING_ONBOARDING;
    return api.get<DriverStatus>(`/api/driver/status/${userEmail}`, status);
};

export const submitOnboardingData = (data: DriverRegistrationData): Promise<{success: boolean, message: string}> => {
    console.log("Submitting onboarding data for user:", data.userEmail, data);
    
    // Update status to PENDING_APPROVAL
    localStorage.setItem(getDriverStatusKey(data.userEmail), DriverStatus.PENDING_APPROVAL); 
    
    // Update the stored profile with submitted name (if available) and new status
    const storedProfile = getStoredProfile(data.userEmail);
    let profileToUpdate = storedProfile ? storedProfile : defaultMockProfile;
    profileToUpdate = {
        ...profileToUpdate,
        name: data.fullName, // Update name from onboarding form
        status: DriverStatus.PENDING_APPROVAL
    };
    saveStoredProfile(data.userEmail, profileToUpdate);

    return api.post('/api/driver/onboarding', data, {success: true, message: 'Dados enviados para aprovação!'});
};

export const getTransactions = (userEmail: string): Promise<Transaction[]> => {
    let transactions = getStoredTransactions(userEmail);
    if (transactions.length === 0 && userEmail === 'test@goly.com') { // Initialize for test user if empty
        transactions = initialMockTransactions;
        saveStoredTransactions(userEmail, transactions);
    }
    return api.get<Transaction[]>('/api/driver/transactions', transactions);
};

export const getRideHistory = (userEmail: string): Promise<Ride[]> => {
    let rides = getStoredRides(userEmail);
    if (rides.length === 0 && userEmail === 'test@goly.com') { // Initialize for test user if empty
        rides = initialMockRides;
        saveStoredRides(userEmail, rides);
    }
    return api.get<Ride[]>('/api/driver/rides', rides);
};

export const getMockTrip = (): Promise<Trip> => {
    return api.get<Trip>('/api/rides/new', initialMockTripData);
};

export const getHeatmapData = (): Promise<[number, number, number][]> => {
    let heatmapDataJson = localStorage.getItem(getHeatmapKey());
    let heatmapData: [number, number, number][] = heatmapDataJson ? JSON.parse(heatmapDataJson) : [];

    if (heatmapData.length === 0) {
        heatmapData = initialMockHeatmapData;
        localStorage.setItem(getHeatmapKey(), JSON.stringify(heatmapData));
    }
    return api.get<[number, number, number][]>('/api/heatmap', heatmapData);
};

export const requestWithdrawal = (userEmail: string, amount: number, pixKey: string): Promise<{success: boolean, message: string}> => {
    console.log(`Requesting withdrawal of ${amount} to Pix key: ${pixKey} for user ${userEmail}`);
    const transactions = getStoredTransactions(userEmail);
    const newTransaction: Transaction = {
        id: `withdrawal_${Date.now()}`,
        description: `Saque Pix para ${pixKey}`,
        amount: -amount, // Negative for withdrawal
        type: 'withdrawal',
        timestamp: new Date().toISOString(), // Use ISO string for consistency
    };
    transactions.unshift(newTransaction); // Add to the beginning
    saveStoredTransactions(userEmail, transactions);

    return api.post('/api/driver/withdrawal', { amount, pixKey }, { success: true, message: 'Saque solicitado com sucesso! Processamento instantâneo.' });
};

export const ratePassenger = (userEmail: string, rideId: string, rating: number, comment?: string): Promise<{success: boolean, message: string}> => {
  console.log(`Rating passenger for ride ${rideId} by ${userEmail}: ${rating} stars, comment: ${comment || 'Nenhum'}`);
  // In a real app, this would update the ride/passenger rating in the backend.
  // For now, we just simulate success.
  return api.post(`/api/rides/${rideId}/rate`, {rating, comment}, {success: true, message: 'Avaliação enviada com sucesso!'});
}
