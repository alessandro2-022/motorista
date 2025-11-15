

import React from 'react';
import { DriverProfile, DriverStatus } from '../types';

interface ProfileScreenProps {
    profile: DriverProfile;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-goly-yellow">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
    </div>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handlePhotoChange = () => {
        fileInputRef.current?.click();
        // In a real app, you would handle the file upload here.
    };

    const formattedMemberSince = new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        year: 'numeric'
    }).format(new Date(profile.memberSince));

    const getStatusDisplay = (status: DriverStatus) => {
        switch (status) {
            case DriverStatus.PENDING_ONBOARDING:
                return { text: 'Pendente de Cadastro', color: 'bg-yellow-500' };
            case DriverStatus.PENDING_APPROVAL:
                return { text: 'Aguardando Aprovação', color: 'bg-orange-500' };
            case DriverStatus.APPROVED:
                return { text: 'Aprovado', color: 'bg-green-500' };
            case DriverStatus.REJECTED:
                return { text: 'Rejeitado', color: 'bg-red-500' };
            default:
                return { text: 'Desconhecido', color: 'bg-gray-500' };
        }
    };

    const { text: statusText, color: statusColor } = getStatusDisplay(profile.status);

    return (
        <div className="h-full w-full bg-goly-dark text-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-goly-yellow mb-8">Meu Perfil</h1>
            
            <div className="flex flex-col items-center bg-gray-900 p-6 rounded-xl shadow-lg">
                <div className="relative">
                    <img src={profile.avatarUrl} alt="Motorista" className="w-32 h-32 rounded-full border-4 border-goly-blue" />
                    <button 
                        onClick={handlePhotoChange}
                        className="absolute bottom-0 right-0 bg-goly-yellow text-goly-dark p-2 rounded-full hover:bg-yellow-300 transition-colors"
                        aria-label="Alterar foto do perfil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                </div>
                
                <h2 className="mt-4 text-2xl font-semibold">{profile.name}</h2>
                <p className="text-gray-400">Membro desde {formattedMemberSince.charAt(0).toUpperCase() + formattedMemberSince.slice(1)}</p>
                
                <span className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold text-white ${statusColor}`}>
                    {statusText}
                </span>

                <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                    <StatCard label="Avaliação" value={`${profile.rating} ★`} />
                    <StatCard label="Corridas Totais" value={profile.totalRides} />
                    <StatCard label="Anos na Goly" value={new Date().getFullYear() - new Date(profile.memberSince).getFullYear()}/>
                </div>
            </div>

            <div className="mt-8 bg-gray-900 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Avaliações de Clientes</h3>
                <div className="space-y-4 text-center text-gray-400">
                   <p>As avaliações dos clientes aparecerão aqui.</p>
                   {/* In a real app, you would map over reviews fetched from the API */}
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;