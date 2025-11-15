import React, { useState, useEffect, useCallback } from 'react';
import { AppView, DriverProfile, DriverStatus } from './types';
import SideMenu from './components/SideMenu';
import MapScreen from './components/MapScreen';
import ProfileScreen from './components/ProfileScreen';
import BalanceScreen from './components/BalanceScreen';
import HistoryScreen from './components/HistoryScreen';
import Chatbot from './components/Chatbot';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen'; // New import
import RegistrationScreen from './components/RegistrationScreen'; // New import
import { MenuIcon } from './components/icons/MenuIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { getDriverProfile, getDriverStatus, logoutUser } from './services/apiService';

const App: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN); // Default to LOGIN
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
    const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null); // New state for logged-in user
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserData = useCallback(async (email: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const status = await getDriverStatus(email);
            setDriverStatus(status);
            if (status === DriverStatus.APPROVED) {
                const data = await getDriverProfile(email);
                setProfile(data);
                setCurrentView(AppView.MAP);
            } else {
                setCurrentView(AppView.ONBOARDING);
            }
        } catch (err) {
            setError('Não foi possível carregar os dados iniciais.');
            console.error(err);
            setLoggedInUserEmail(null); // Clear login if data fetch fails
            setCurrentView(AppView.LOGIN);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedEmail = localStorage.getItem('loggedInUserEmail');
        if (storedEmail) {
            setLoggedInUserEmail(storedEmail);
            loadUserData(storedEmail);
        } else {
            // For initial load, always try to log in the test user for immediate access
            // This ensures a smooth start for testing all features
            handleLogin('test@goly.com'); 
        }
    }, [loadUserData]);

    const handleLogin = (email: string) => {
        localStorage.setItem('loggedInUserEmail', email);
        setLoggedInUserEmail(email);
        loadUserData(email);
    };

    const handleRegister = (email: string) => {
        // After successful registration, directly log them in (or show login screen)
        // For simplicity, we'll auto-login after register, sending to onboarding
        localStorage.setItem('loggedInUserEmail', email);
        setLoggedInUserEmail(email);
        setDriverStatus(DriverStatus.PENDING_ONBOARDING); // Set initial status for newly registered
        setCurrentView(AppView.ONBOARDING);
        setIsLoading(false);
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logoutUser();
            setLoggedInUserEmail(null);
            setProfile(null);
            setDriverStatus(null);
            setCurrentView(AppView.LOGIN);
        } catch (err) {
            console.error("Logout failed:", err);
            setError("Falha ao desconectar.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (view: AppView) => {
        setCurrentView(view);
        setIsMenuOpen(false);
    };

    const handleBackToMap = () => {
        setCurrentView(AppView.MAP);
    };

    const handleOnboardingComplete = (status: DriverStatus) => {
        setDriverStatus(status);
        if (loggedInUserEmail) {
            if (status === DriverStatus.APPROVED) {
                getDriverProfile(loggedInUserEmail).then(setProfile).catch(console.error);
                setCurrentView(AppView.MAP);
            } else {
                setCurrentView(AppView.ONBOARDING); // Stay on onboarding status screen if pending/rejected
            }
        } else {
            // Should not happen if onboarding is reached correctly
            handleLogout();
        }
    };

    const renderView = () => {
        if (isLoading) {
            return <div className="h-full w-full flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-goly-blue border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (error) {
            return <div className="h-full w-full flex items-center justify-center text-red-400 p-4">{error}</div>;
        }

        if (!loggedInUserEmail) {
            switch (currentView) {
                case AppView.REGISTER:
                    return <RegistrationScreen onRegister={handleRegister} onNavigateToLogin={() => setCurrentView(AppView.LOGIN)} />;
                case AppView.LOGIN:
                default:
                    return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setCurrentView(AppView.REGISTER)} />;
            }
        }

        // If logged in, proceed with driver status checks
        if (driverStatus !== DriverStatus.APPROVED && currentView !== AppView.ONBOARDING) {
            // Ensure driver sees onboarding if not approved, even if they try to navigate elsewhere
            return <OnboardingScreen driverStatus={driverStatus!} onComplete={handleOnboardingComplete} loggedInUserEmail={loggedInUserEmail!} />;
        }
        
        switch (currentView) {
            case AppView.ONBOARDING:
                return <OnboardingScreen driverStatus={driverStatus!} onComplete={handleOnboardingComplete} loggedInUserEmail={loggedInUserEmail!} />;
            case AppView.MAP:
                return <MapScreen driverStatus={driverStatus!} loggedInUserEmail={loggedInUserEmail!} />;
            case AppView.PROFILE:
                return profile ? <ProfileScreen profile={profile} /> : <div>Perfil não encontrado.</div>;
            case AppView.BALANCE:
                return <BalanceScreen loggedInUserEmail={loggedInUserEmail!} />;
            case AppView.HISTORY:
                return <HistoryScreen loggedInUserEmail={loggedInUserEmail!} />;
            case AppView.CHAT:
                return <Chatbot />;
            case AppView.LOGIN: // Should not happen if loggedInUserEmail is set
            case AppView.REGISTER: // Should not happen if loggedInUserEmail is set
            default:
                return <MapScreen driverStatus={driverStatus!} loggedInUserEmail={loggedInUserEmail!} />; // Fallback
        }
    };

    const showBackButton = (currentView !== AppView.MAP && currentView !== AppView.ONBOARDING && currentView !== AppView.LOGIN && currentView !== AppView.REGISTER);
    const showMenuButton = (loggedInUserEmail && currentView === AppView.MAP && driverStatus === DriverStatus.APPROVED);

    return (
        <div className="h-screen w-screen bg-goly-dark font-sans text-goly-light overflow-hidden flex">
           {loggedInUserEmail && profile && driverStatus === DriverStatus.APPROVED && (
             <SideMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onNavigate={handleNavigate}
                profile={profile}
                onLogout={handleLogout} // Pass logout handler
            />
           )}
            <main className="flex-1 flex flex-col relative">
                <div className="absolute top-4 left-4 z-20">
                    {showMenuButton && (
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                            aria-label="Abrir menu"
                        >
                           <MenuIcon className="h-6 w-6" />
                        </button>
                    )}
                    {showBackButton && (
                        <button 
                            onClick={handleBackToMap}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                            aria-label="Voltar para o mapa"
                        >
                           <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
                {renderView()}
            </main>
        </div>
    );
};

export default App;