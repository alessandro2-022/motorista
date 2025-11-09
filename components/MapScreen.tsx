import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { CloseIcon } from './icons/CloseIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { Trip } from '../types';
import { getMockTrip } from '../services/apiService';

const MapScreen: React.FC = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [isAcceptingTrip, setIsAcceptingTrip] = useState(false);
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const routeLayerRef = useRef<L.Polyline | null>(null);
    const simulationIntervalRef = useRef<number | null>(null);
    const routeIndexRef = useRef(0);


     const handleEndTrip = useCallback(() => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        if (routeLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        setActiveTrip(null);
    }, []);

    const handleAcceptTrip = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !userMarkerRef.current) return;
        
        setIsAcceptingTrip(true);
        try {
            const tripData = await getMockTrip(); // In a real app, this would come from a WebSocket
            setActiveTrip(tripData);
            
            routeLayerRef.current = L.polyline(tripData.route, {
                color: '#0052cc',
                weight: 6,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(map);

            map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

            routeIndexRef.current = 0;
            // This part remains a simulation of movement for demonstration
            simulationIntervalRef.current = window.setInterval(() => {
                if (routeIndexRef.current < tripData.route.length) {
                    const nextPoint = tripData.route[routeIndexRef.current];
                    userMarkerRef.current?.setLatLng(nextPoint as L.LatLngExpression);
                    routeIndexRef.current++;
                } else {
                    handleEndTrip();
                }
            }, 1000);

        } catch (error) {
            console.error("Failed to fetch trip data", error);
            // Show an error to the user
        } finally {
            setIsAcceptingTrip(false);
        }
    }, [handleEndTrip]);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const map = L.map(mapContainerRef.current!, { zoomControl: false, attributionControl: false }).setView([latitude, longitude], 15);
            mapRef.current = map;

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
            }).addTo(map);
            
            const driverIcon = L.divIcon({
                className: 'driver-marker',
                html: '<div class="w-4 h-4 bg-goly-blue rounded-full border-2 border-white animate-pulse"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            userMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon }).addTo(map);

            const watchId = navigator.geolocation.watchPosition(pos => {
                if (!activeTrip) { // Only update from GPS if not simulating a trip
                    const newLatLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLatLng(newLatLng);
                    }
                    // In a real app, you would send this location to the backend
                    // updateDriverLocation(newLatLng);
                }
            });

            return () => {
                 navigator.geolocation.clearWatch(watchId);
                 if (simulationIntervalRef.current) {
                    clearInterval(simulationIntervalRef.current);
                 }
                 map.remove();
                 mapRef.current = null;
            }

        }, (error) => {
            console.error("Error getting geolocation", error);
            // Fallback to a default location
            const map = L.map(mapContainerRef.current!, { zoomControl: false, attributionControl: false }).setView([-23.5505, -46.6333], 13);
            mapRef.current = map;
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
            }).addTo(map);
        });
        
    }, [activeTrip]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
        }
    }, []);

    const renderBottomPanelContent = () => {
        if (!isOnline) {
            return (
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-300">Fique online para receber solicitações de corrida.</p>
                </div>
            );
        }

        if (activeTrip) {
            return (
                <div>
                    <div className="text-center p-4 bg-goly-blue/20 border border-goly-blue rounded-lg mb-4">
                        <p className="font-semibold">Em corrida com {activeTrip.passengerName}</p>
                        <p className="text-sm text-gray-300 mt-1">Destino: {activeTrip.dropoffAddress}</p>
                    </div>
                    <button onClick={handleEndTrip} className="w-full flex items-center justify-center bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                        <StopIcon className="w-5 h-5 mr-2" />
                        Finalizar Corrida
                    </button>
                </div>
            );
        }

        return (
            <div>
                <div className="text-center p-4 bg-goly-blue/20 border border-goly-blue rounded-lg mb-4">
                    <p className="font-semibold text-goly-yellow">Procurando por passageiros próximos...</p>
                    <p className="text-sm text-gray-300 mt-1">Aguardando novas chamadas.</p>
                </div>
                 <button onClick={handleAcceptTrip} disabled={isAcceptingTrip} className="w-full flex items-center justify-center bg-goly-yellow text-goly-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-600">
                    <PlayIcon className="w-5 h-5 mr-2" />
                    {isAcceptingTrip ? 'Aguardando...' : 'Receber Chamada (Teste)'}
                </button>
            </div>
        );
    };

    return (
        <div className="h-full w-full relative">
            <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full bg-goly-dark" />
            
            {/* Bottom UI */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <div className="bg-goly-dark p-4 rounded-xl shadow-2xl max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="font-semibold text-lg">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <label htmlFor="online-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isOnline}
                                onChange={() => setIsOnline(!isOnline)} 
                                id="online-toggle" 
                                className="sr-only peer" 
                                disabled={!!activeTrip}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-goly-blue peer-disabled:opacity-50"></div>
                        </label>
                    </div>

                    {renderBottomPanelContent()}
                </div>
            </div>
        </div>
    );
};

export default MapScreen;