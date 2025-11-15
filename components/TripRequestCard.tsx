
import React from 'react';
import { Trip } from '../types';

interface TripRequestCardProps {
    trip: Trip;
    onAccept: () => void;
    onDecline: () => void;
}

const TripRequestCard: React.FC<TripRequestCardProps> = ({ trip, onAccept, onDecline }) => {
    const formattedFare = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.fare);

    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="trip-request-title">
            <div className="bg-goly-dark rounded-xl w-full max-w-sm shadow-2xl animate-fade-in-up">
                <div className="p-6 text-center border-b border-gray-700">
                    <h2 id="trip-request-title" className="text-2xl font-bold text-goly-yellow mb-2">Nova Solicitação de Corrida!</h2>
                    <p className="text-gray-300 text-sm">Passageiro próximo</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                        <img src={trip.passengerAvatarUrl} alt={trip.passengerName} className="w-16 h-16 rounded-full border-2 border-goly-blue" />
                        <div>
                            <p className="text-xl font-semibold text-white">{trip.passengerName}</p>
                            <p className="text-sm text-gray-400">Distância: {trip.distanceToPassenger}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                        <div>
                            <p className="text-xs text-gray-400">Pegar em:</p>
                            <p className="font-medium text-white">{trip.pickupAddress}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Destino:</p>
                            <p className="font-medium text-white">{trip.dropoffAddress}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-400">Tarifa Estimada</p>
                            <p className="text-2xl font-bold text-goly-yellow">{formattedFare.replace('R$', 'R$ ')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Duração Estimada</p>
                            <p className="text-xl font-bold text-white">{trip.estimatedDuration}</p>
                        </div>
                    </div>
                </div>

                <div className="flex p-4 border-t border-gray-700">
                    <button
                        onClick={onDecline}
                        className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg mr-2 hover:bg-gray-600 transition-colors"
                    >
                        Rejeitar
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 bg-goly-blue text-white font-bold py-3 rounded-lg ml-2 hover:bg-blue-600 transition-colors"
                    >
                        Aceitar Corrida
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripRequestCard;
