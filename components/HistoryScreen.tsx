import React, { useState, useEffect } from 'react';
import { Ride } from '../types';
import { getRideHistory } from '../services/apiService';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { CloseIcon } from './icons/CloseIcon';


const RideItem: React.FC<{ ride: Ride, onClick: () => void }> = ({ ride, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
        <div className="flex items-center">
            <img src={ride.passengerAvatarUrl} alt={ride.passengerName} className="w-12 h-12 rounded-full" />
            <div className="ml-4 text-left">
                <p className="font-semibold text-white">Corrida com {ride.passengerName}</p>
                <p className="text-sm text-gray-400">{new Date(ride.date).toLocaleDateString('pt-BR')}</p>
            </div>
        </div>
        <div className="flex items-center">
            <p className="text-lg font-bold text-goly-yellow mr-4">R${ride.fare.toFixed(2).replace('.', ',')}</p>
            <ChevronRightIcon className="w-6 h-6 text-gray-500" />
        </div>
    </button>
);

const RideDetailModal: React.FC<{ ride: Ride, onClose: () => void }> = ({ ride, onClose }) => {
    const paymentMethodPortuguese = ride.paymentMethod === 'Credit Card' ? 'Cartão de Crédito' : 'Dinheiro';

    return (
        <div className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-goly-yellow">Detalhes da Corrida</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-300" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center">
                        <img src={ride.passengerAvatarUrl} alt={ride.passengerName} className="w-16 h-16 rounded-full" />
                        <p className="ml-4 text-2xl font-semibold text-white">{ride.passengerName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">De</p>
                        <p className="text-lg text-white">{ride.pickup}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Para</p>
                        <p className="text-lg text-white">{ride.dropoff}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                        <div>
                            <p className="text-sm text-gray-400">Tarifa</p>
                            <p className="text-2xl font-bold text-goly-yellow">R${ride.fare.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Pagamento</p>
                            <p className="text-lg text-white">{paymentMethodPortuguese}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-b-xl">
                    <button className="w-full bg-goly-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors">
                        Obter Suporte Para Esta Corrida
                    </button>
                </div>
            </div>
        </div>
    );
};

const HistoryScreen: React.FC = () => {
    const [rides, setRides] = useState<Ride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getRideHistory();
                setRides(data);
            } catch (err) {
                setError("Não foi possível carregar o histórico de corridas.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="h-full w-full bg-goly-dark text-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-goly-yellow mb-8">Histórico de Corridas</h1>
            
            {isLoading ? (
                <div className="text-center text-gray-400">Carregando histórico...</div>
            ) : error ? (
                <div className="text-center text-red-400">{error}</div>
            ) : (
                <div className="space-y-3">
                    {rides.length > 0 ? (
                        rides.map(ride => (
                            <RideItem key={ride.id} ride={ride} onClick={() => setSelectedRide(ride)} />
                        ))
                    ) : (
                        <p className="text-center text-gray-400">Nenhuma corrida no seu histórico.</p>
                    )}
                </div>
            )}

            {selectedRide && <RideDetailModal ride={selectedRide} onClose={() => setSelectedRide(null)} />}
        </div>
    );
};

export default HistoryScreen;