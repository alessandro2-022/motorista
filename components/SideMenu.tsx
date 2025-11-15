import React from 'react';
import { AppView, DriverProfile } from '../types';
import { UserIcon } from './icons/UserIcon';
import { WalletIcon } from './icons/WalletIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { LogoutIcon } from './icons/LogoutIcon'; // New import

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: AppView) => void;
    profile: DriverProfile;
    onLogout: () => void; // New prop for logout
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center p-3 text-lg text-gray-200 hover:bg-goly-blue/50 hover:text-white rounded-lg transition-colors duration-200">
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate, profile, onLogout }) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <div className={`fixed top-0 left-0 h-full bg-goly-dark w-72 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-4 text-white">
                    <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center space-x-2">
                             <div className="w-12 h-12 bg-goly-blue rounded-full flex items-center justify-center font-black text-2xl text-goly-yellow">
                                 G
                             </div>
                            <span className="text-2xl font-bold">Goly</span>
                         </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center p-4 border-b border-gray-700 mb-4">
                        <img src={profile.avatarUrl} alt="Driver" className="w-20 h-20 rounded-full border-2 border-goly-blue" />
                        <h3 className="mt-3 text-xl font-semibold">{profile.name}</h3>
                        <p className="text-sm text-gray-400">Avaliação: {profile.rating} ★</p>
                    </div>

                    <nav className="flex-grow space-y-2">
                        <NavItem icon={<UserIcon className="w-6 h-6"/>} label="Perfil" onClick={() => onNavigate(AppView.PROFILE)} />
                        <NavItem icon={<WalletIcon className="w-6 h-6"/>} label="Saldo" onClick={() => onNavigate(AppView.BALANCE)} />
                        <NavItem icon={<HistoryIcon className="w-6 h-6"/>} label="Histórico de Corridas" onClick={() => onNavigate(AppView.HISTORY)} />
                        <NavItem icon={<ChatIcon className="w-6 h-6"/>} label="Assistente Goly IA" onClick={() => onNavigate(AppView.CHAT)} />
                    </nav>

                    <div className="mt-4 border-t border-gray-700 pt-4">
                         <NavItem icon={<LogoutIcon className="w-6 h-6"/>} label="Sair" onClick={onLogout} />
                    </div>

                    <div className="text-center text-xs text-gray-500 p-2">
                        App Goly Motorista v1.0.0
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideMenu;