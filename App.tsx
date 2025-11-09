import React, { useState, useEffect } from 'react';
import { AppView, DriverProfile } from './types';
import SideMenu from './components/SideMenu';
import MapScreen from './components/MapScreen';
import ProfileScreen from './components/ProfileScreen';
import BalanceScreen from './components/BalanceScreen';
import HistoryScreen from './components/HistoryScreen';
import Chatbot from './components/Chatbot';
import { MenuIcon } from './components/icons/MenuIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { getDriverProfile } from './services/apiService';

const App: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>(AppView.MAP);
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getDriverProfile();
                setProfile(data);
            } catch (err) {
                setError('Não foi possível carregar os dados do perfil.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);


    const handleNavigate = (view: AppView) => {
        setCurrentView(view);
        setIsMenuOpen(false);
    };

    const handleBackToMap = () => {
        setCurrentView(AppView.MAP);
    };

    const renderView = () => {
        if (isLoading) {
            return <div className="h-full w-full flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-goly-blue border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (error) {
            return <div className="h-full w-full flex items-center justify-center text-red-400 p-4">{error}</div>;
        }

        switch (currentView) {
            case AppView.MAP:
                return <MapScreen />;
            case AppView.PROFILE:
                return profile ? <ProfileScreen profile={profile} /> : <div>Perfil não encontrado.</div>;
            // FIX: Corrected typo from AppVfew to AppView.
            case AppView.BALANCE:
                return <BalanceScreen />;
            case AppView.HISTORY:
                return <HistoryScreen />;
            case AppView.CHAT:
                return <Chatbot />;
            default:
                return <MapScreen />;
        }
    };

    return (
        <div className="h-screen w-screen bg-goly-dark font-sans text-goly-light overflow-hidden flex">
           {profile && (
             <SideMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onNavigate={handleNavigate}
                profile={profile}
            />
           )}
            <main className="flex-1 flex flex-col relative">
                <div className="absolute top-4 left-4 z-20">
                    {currentView === AppView.MAP ? (
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                            aria-label="Abrir menu"
                        >
                           <MenuIcon className="h-6 w-6" />
                        </button>
                    ) : (
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