
import React, { useState, useCallback, useEffect, useRef } from 'react';
// Fix: Augment the 'leaflet' module to include types for the 'leaflet.heat' plugin.
// This provides type definitions for L.HeatLayer class and L.heatLayer factory function.
declare module 'leaflet' {
    // Augment the existing L namespace exported by the 'leaflet' module
    namespace L { 
        // Fix: Use L.Layer to correctly reference the base Layer class from Leaflet.
        class HeatLayer extends L.Layer {
            constructor(latlngs: [number, number, number][], options?: any);
            // L.Layer already defines addTo and remove, so explicit re-declaration is often not needed
            // unless there's a specific conflict or different signature expected by the plugin.
        }

        // The L.heatLayer factory function is added to the L namespace by the plugin.
        function heatLayer(latlngs: [number, number, number][], options?: any): HeatLayer;
    }
}
import * as L from 'leaflet'; 
import 'leaflet.heat'; // Make sure this is imported after L is defined
import { CloseIcon } from './icons/CloseIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { Trip, TripStage, DriverStatus, Transaction } from '../types';
import { getMockTrip, getHeatmapData, ratePassenger, getTransactions } from '../services/apiService';
import TripRequestCard from './TripRequestCard';
import RatePassengerModal from './RatePassengerModal';




interface MapScreenProps {
    driverStatus: DriverStatus;
    loggedInUserEmail: string; // Add loggedInUserEmail prop
}

const MapScreen: React.FC<MapScreenProps> = ({ driverStatus, loggedInUserEmail }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [tripStage, setTripStage] = useState<TripStage>(TripStage.SEARCHING);
    const [isAcceptingTrip, setIsAcceptingTrip] = useState(false);
    const [isMarkerFlashing, setIsMarkerFlashing] = useState(false);
    const [showRatePassengerModal, setShowRatePassengerModal] = useState(false);
    const [lastCompletedTripId, setLastCompletedTripId] = useState<string | null>(null);
    const [currentDailyEarnings, setCurrentDailyEarnings] = useState<number>(0);


    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const passengerMarkerRef = useRef<L.Marker | null>(null); // New passenger marker
    const dropoffMarkerRef = useRef<L.Marker | null>(null); // New dropoff marker
    const routeLayerRef = useRef<L.Polyline | null>(null);
    const simulationIntervalRef = useRef<number | null>(null);
    const routeIndexRef = useRef(0);
    const heatmapLayerRef = useRef<L.HeatLayer | null>(null); // Ref for heatmap layer


    const isDriverApproved = driverStatus === DriverStatus.APPROVED;

    const fetchDailyEarnings = useCallback(async () => {
        try {
            const transactions = await getTransactions(loggedInUserEmail);
            const today = new Date();
            const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD for comparison

            const earnings = transactions
                .filter(t => 
                    (t.type === 'earning' || t.type === 'tip' || t.type === 'bonus') && 
                    new Date(t.timestamp).toISOString().split('T')[0] === todayString // Compare full date
                )
                .reduce((sum, t) => sum + t.amount, 0);
            setCurrentDailyEarnings(earnings);
        } catch (error) {
            console.error("Failed to fetch daily earnings:", error);
            setCurrentDailyEarnings(0);
        }
    }, [loggedInUserEmail]);

    useEffect(() => {
        fetchDailyEarnings(); // Fetch on component mount and email change
        const intervalId = setInterval(fetchDailyEarnings, 60000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, [fetchDailyEarnings]);


    const handleEndTrip = useCallback(() => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        if (routeLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        if (passengerMarkerRef.current && mapRef.current) {
            mapRef.current.removeLayer(passengerMarkerRef.current);
            passengerMarkerRef.current = null;
        }
        if (dropoffMarkerRef.current && mapRef.current) {
            mapRef.current.removeLayer(dropoffMarkerRef.current);
            dropoffMarkerRef.current = null;
        }

        // Set last completed trip ID for rating
        if (activeTrip) {
            setLastCompletedTripId(activeTrip.passengerName + Date.now().toString()); // Mock ID
        }

        setActiveTrip(null);
        setTripStage(TripStage.COMPLETED); // Go to completed stage to trigger rating
        setIsMarkerFlashing(false);
        // Do not immediately go back to SEARCHING, wait for rating
        fetchDailyEarnings(); // Refresh daily earnings after trip completion
    }, [activeTrip, fetchDailyEarnings]);

    const handleRatePassenger = useCallback(async (rating: number, comment?: string) => {
        setShowRatePassengerModal(false);
        if (lastCompletedTripId) {
            await ratePassenger(loggedInUserEmail, lastCompletedTripId, rating, comment); // Pass userEmail
            console.log("Passageiro avaliado com sucesso!");
        }
        setTripStage(TripStage.SEARCHING); // Back to searching after rating
        setLastCompletedTripId(null);
    }, [lastCompletedTripId, loggedInUserEmail]);


    // Function to create or update the driver's custom icon based on flashing state
    const createDriverIcon = useCallback((flashing: boolean, arrivedAtPassenger: boolean) => {
        const markerColor = arrivedAtPassenger ? 'bg-green-500' : (flashing ? 'bg-goly-yellow' : 'bg-goly-blue');
        const pingColor = arrivedAtPassenger ? 'bg-green-500' : 'bg-goly-yellow';
        
        const mainMarkerHtml = `
            <div class="absolute w-4 h-4 rounded-full border-2 border-white 
                 ${markerColor} ${flashing && !arrivedAtPassenger ? 'animate-pulse' : ''} 
                 transition-colors duration-300"
                 style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
            </div>
        `;
        const pingHtml = (flashing && !arrivedAtPassenger) 
            ? `<div class="absolute w-4 h-4 rounded-full ${pingColor} opacity-75 animate-ping 
                   transition-opacity duration-300"
                   style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
               </div>` 
            : '';

        return L.divIcon({
            className: '',
            html: `
                <div class="relative w-6 h-6">
                    ${pingHtml}
                    ${mainMarkerHtml}
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }, []);

    const createPassengerIcon = useCallback(() => {
        return L.divIcon({
            className: 'bg-white text-goly-dark font-bold rounded-full flex items-center justify-center p-1 shadow-md',
            html: `P`, // Simple 'P' for passenger
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }, []);

    const createDropoffIcon = useCallback(() => {
        return L.divIcon({
            className: 'bg-red-500 text-white font-bold rounded-full flex items-center justify-center p-1 shadow-md',
            html: `D`, // Simple 'D' for dropoff
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }, []);


    const handleAcceptTrip = useCallback(async (tripData: Trip) => {
        const map = mapRef.current;
        if (!map || !userMarkerRef.current) return;
        
        setActiveTrip(tripData);
        setTripStage(TripStage.EN_ROUTE_TO_PASSENGER);
        setIsMarkerFlashing(false); // Stop flashing once trip is accepted

        const userLatLng = userMarkerRef.current.getLatLng();
        const passengerLatLng = tripData.route[0]; // First point of the route is passenger pickup

        // Add passenger marker
        passengerMarkerRef.current = L.marker(passengerLatLng as L.LatLngExpression, { icon: createPassengerIcon() }).addTo(map);

        // Draw route to passenger
        // Simulate route to passenger pickup (first half of the route)
        const routeToPassenger = tripData.route.slice(0, Math.ceil(tripData.route.length / 2)); 
        // Prepend current user position to the route to passenger
        const fullRouteToPassenger = [userLatLng.toArray(), ...routeToPassenger];

        routeLayerRef.current = L.polyline(fullRouteToPassenger as L.LatLngExpression[], {
            color: '#0052cc',
            weight: 6,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(map);

        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

        routeIndexRef.current = 0;
        // Simulate movement to passenger
        simulationIntervalRef.current = window.setInterval(() => {
            if (userMarkerRef.current && routeIndexRef.current < fullRouteToPassenger.length) {
                const nextPoint = fullRouteToPassenger[routeIndexRef.current];
                userMarkerRef.current.setLatLng(nextPoint as L.LatLngExpression);
                map.panTo(nextPoint as L.LatLngExpression, { animate: true, duration: 0.5 });
                routeIndexRef.current++;
            } else {
                clearInterval(simulationIntervalRef.current!);
                simulationIntervalRef.current = null;
                setTripStage(TripStage.ARRIVED_AT_PASSENGER); // Arrived at passenger
                // Update driver marker to green
                userMarkerRef.current?.setIcon(createDriverIcon(false, true));
                // Remove passenger marker
                if (passengerMarkerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(passengerMarkerRef.current);
                    passengerMarkerRef.current = null;
                }
            }
        }, 1000);
    }, [createDriverIcon, createPassengerIcon]);

    const handleDeclineTrip = useCallback(() => {
        setIsAcceptingTrip(false);
        setTripStage(TripStage.SEARCHING);
        // No trip data to clear since it was declined
    }, []);

    const handleGoOnline = useCallback(async () => {
        if (!isDriverApproved) return; // Cannot go online if not approved
        setIsOnline(true);
        setIsMarkerFlashing(true); // Start flashing when searching
        // Fetch and display heatmap data
        try {
            const data = await getHeatmapData();
            const map = mapRef.current;
            if (map && !heatmapLayerRef.current) {
                // Ensure Leaflet.Heat is initialized correctly
                if (L.heatLayer) {
                    heatmapLayerRef.current = L.heatLayer(data, {radius: 25, blur: 15, maxZoom: 17, gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}}).addTo(map);
                } else {
                    console.error("Leaflet.Heat plugin not loaded.");
                }
            }
        } catch (error) {
            console.error("Failed to fetch heatmap data:", error);
        }
    }, [isDriverApproved]);

    const handleGoOffline = useCallback(() => {
        setIsOnline(false);
        setIsMarkerFlashing(false);
        setTripStage(TripStage.SEARCHING); // Ensure trip stage resets
        if (heatmapLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(heatmapLayerRef.current);
            heatmapLayerRef.current = null;
        }
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        if (routeLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        if (userMarkerRef.current) {
            userMarkerRef.current.setIcon(createDriverIcon(false, false)); // Back to normal icon
        }
    }, [createDriverIcon]);

    const handleArrivedAtPassenger = useCallback(() => {
        if (!activeTrip) return;
        setTripStage(TripStage.ARRIVED_AT_PASSENGER);
        // Already updated marker in simulation interval
    }, [activeTrip]);

    const handleStartTrip = useCallback(() => {
        if (!activeTrip || !mapRef.current || !userMarkerRef.current) return;

        setTripStage(TripStage.EN_ROUTE_TO_DROPOFF);
        // Update route layer to show path to dropoff
        if (routeLayerRef.current && mapRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
        }
        
        // Add dropoff marker
        const dropoffLatLng = activeTrip.route[activeTrip.route.length - 1];
        dropoffMarkerRef.current = L.marker(dropoffLatLng as L.LatLngExpression, { icon: createDropoffIcon() }).addTo(mapRef.current);

        // Path from passenger pickup to final dropoff
        const routeToDropoff = activeTrip.route.slice(Math.ceil(activeTrip.route.length / 2) -1); // Starting from passenger pickup point

        routeLayerRef.current = L.polyline(routeToDropoff as L.LatLngExpression[], {
            color: '#0052cc',
            weight: 6,
            opacity: 0.8,
        }).addTo(mapRef.current);

        mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

        routeIndexRef.current = 0;
        // Simulate movement to dropoff
        simulationIntervalRef.current = window.setInterval(() => {
            if (userMarkerRef.current && routeIndexRef.current < routeToDropoff.length) {
                const nextPoint = routeToDropoff[routeIndexRef.current];
                userMarkerRef.current.setLatLng(nextPoint as L.LatLngExpression);
                mapRef.current?.panTo(nextPoint as L.LatLngExpression, { animate: true, duration: 0.5 });
                routeIndexRef.current++;
            } else {
                clearInterval(simulationIntervalRef.current!);
                simulationIntervalRef.current = null;
                handleEndTrip(); // Trip completed
            }
        }, 1000);
    }, [activeTrip, handleEndTrip, createDropoffIcon]);


    // Effect for initializing the map and the initial marker
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
            
            userMarkerRef.current = L.marker([latitude, longitude], { icon: createDriverIcon(false, false) }).addTo(map);

            const watchId = navigator.geolocation.watchPosition(pos => {
                if (!activeTrip && isOnline) { // Only update from GPS if not simulating a trip AND is online
                    const newLatLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLatLng(newLatLng);
                        map.panTo(newLatLng, { animate: true, duration: 0.5 });
                    }
                }
            });

            return () => {
                 navigator.geolocation.clearWatch(watchId);
                 if (simulationIntervalRef.current) {
                    clearInterval(simulationIntervalRef.current);
                 }
                 if (heatmapLayerRef.current && mapRef.current) {
                     mapRef.current.removeLayer(heatmapLayerRef.current);
                     heatmapLayerRef.current = null; // Clear ref on cleanup
                 }
                 map.remove();
                 mapRef.current = null;
            }

        }, (error) => {
            console.error("Error getting geolocation", error);
            // Fallback to a default location
            const defaultLatLng: L.LatLngExpression = [-23.5505, -46.6333]; // São Paulo
            const map = L.map(mapContainerRef.current!, { zoomControl: false, attributionControl: false }).setView(defaultLatLng, 13);
            mapRef.current = map;
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
            }).addTo(map);
            if (!userMarkerRef.current) {
                userMarkerRef.current = L.marker(defaultLatLng, { icon: createDriverIcon(false, false) }).addTo(map);
            }
        });
        
    }, [activeTrip, isOnline, createDriverIcon]); // activeTrip and isOnline are dependencies for conditional GPS updates

    // Effect to update driver marker icon when flashing state changes
    useEffect(() => {
        if (userMarkerRef.current) {
            const isArrived = tripStage === TripStage.ARRIVED_AT_PASSENGER;
            userMarkerRef.current.setIcon(createDriverIcon(isMarkerFlashing, isArrived));
        }
    }, [isMarkerFlashing, tripStage, createDriverIcon]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
            if (mapRef.current) {
                if (heatmapLayerRef.current) { // Ensure heatmap layer is removed
                    mapRef.current.removeLayer(heatmapLayerRef.current);
                    heatmapLayerRef.current = null;
                }
                mapRef.current.remove();
                mapRef.current = null;
            }
        }
    }, []);

    // Trigger rating modal when trip is completed
    useEffect(() => {
        if (tripStage === TripStage.COMPLETED) {
            setShowRatePassengerModal(true);
        }
    }, [tripStage]);

    const formattedDailyEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentDailyEarnings);


    const renderBottomPanelContent = () => {
        if (!isOnline) {
            return (
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                    {!isDriverApproved && <p className="text-red-400 mb-2">Sua conta ainda não foi aprovada. Verifique seu perfil.</p>}
                    <p className="text-gray-300">Fique online para receber solicitações de corrida.</p>
                </div>
            );
        }

        if (tripStage === TripStage.TRIP_REQUEST) {
            // Trip request card is rendered separately, not in this panel content
            return null; 
        }

        if (activeTrip) {
            // Display trip details at the top of the panel
            const currentStatusText = 
                tripStage === TripStage.EN_ROUTE_TO_PASSENGER ? `A caminho de ${activeTrip.passengerName}` :
                tripStage === TripStage.ARRIVED_AT_PASSENGER ? `Chegou em ${activeTrip.passengerName}` :
                tripStage === TripStage.EN_ROUTE_TO_DROPOFF ? `Em corrida para ${activeTrip.dropoffAddress}` : '';

            return (
                <div>
                    <div className="text-center p-4 bg-goly-blue/20 border border-goly-blue rounded-lg mb-4">
                        <p className="font-semibold">{currentStatusText}</p>
                        {tripStage === TripStage.EN_ROUTE_TO_PASSENGER && (
                            <p className="text-sm text-gray-300 mt-1">Pegar: {activeTrip.pickupAddress}</p>
                        )}
                        {tripStage === TripStage.EN_ROUTE_TO_DROPOFF && (
                            <p className="text-sm text-gray-300 mt-1">Destino: ${activeTrip.dropoffAddress}</p>
                        )}
                    </div>
                    {tripStage === TripStage.ARRIVED_AT_PASSENGER && (
                        <button onClick={handleStartTrip} className="w-full flex items-center justify-center bg-goly-yellow text-goly-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors" aria-label="Iniciar corrida">
                            <PlayIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                            Iniciar Corrida
                        </button>
                    )}
                    {tripStage === TripStage.EN_ROUTE_TO_DROPOFF && (
                         <button onClick={handleEndTrip} className="w-full flex items-center justify-center bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors" aria-label="Finalizar corrida atual">
                            <StopIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                            Finalizar Corrida
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div>
                <div className="text-center p-4 bg-goly-blue/20 border border-goly-blue rounded-lg mb-4">
                    <p className="font-semibold text-goly-yellow">Procurando por passageiros próximos...</p>
                    <p className="text-sm text-gray-300 mt-1">Aguardando novas chamadas.</p>
                </div>
                 <button onClick={async () => {
                     setIsAcceptingTrip(true);
                     setTripStage(TripStage.TRIP_REQUEST);
                     try {
                         const tripData = await getMockTrip();
                         setActiveTrip(tripData);
                     } catch (error) {
                         console.error("Falha ao buscar dados da corrida para solicitação", error);
                         setTripStage(TripStage.SEARCHING); // Fallback
                     } finally {
                         setIsAcceptingTrip(false);
                     }
                 }} disabled={isAcceptingTrip} className="w-full flex items-center justify-center bg-goly-yellow text-goly-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" aria-label={isAcceptingTrip ? 'Aguardando aceitação da corrida' : 'Receber chamada de teste'}>
                    <PlayIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                    {isAcceptingTrip ? 'Aguardando...' : 'Receber Chamada (Teste)'}
                </button>
            </div>
        );
    };

    return (
        <div className="h-full w-full relative">
            <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full bg-goly-dark" />
            
            {/* Daily Earnings Floating Tab */}
            {isDriverApproved && (
                <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 
                                bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-xl 
                                p-3 flex items-center space-x-2"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <span className="text-sm text-gray-300 font-medium">Saldo do Dia:</span>
                    <span className="text-lg font-bold text-goly-yellow">{formattedDailyEarnings}</span>
                </div>
            )}

            {/* Trip Request Card - Renders on top of everything when a request comes in */}
            {tripStage === TripStage.TRIP_REQUEST && activeTrip && (
                <TripRequestCard 
                    trip={activeTrip}
                    onAccept={() => handleAcceptTrip(activeTrip)}
                    onDecline={handleDeclineTrip}
                />
            )}

            {/* Bottom UI */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <div className="bg-goly-dark p-4 rounded-xl shadow-2xl max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${isOnline && isDriverApproved ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="font-semibold text-lg">{isOnline && isDriverApproved ? 'Online' : 'Offline'}</span>
                        </div>
                        <label htmlFor="online-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isOnline && isDriverApproved}
                                onChange={e => e.target.checked ? handleGoOnline() : handleGoOffline()} 
                                id="online-toggle" 
                                className="sr-only peer" 
                                disabled={!!activeTrip || !isDriverApproved || tripStage === TripStage.TRIP_REQUEST}
                                aria-label={isOnline ? 'Alternar para offline' : 'Alternar para online'}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-goly-blue peer-disabled:opacity-50"></div>
                        </label>
                    </div>

                    {renderBottomPanelContent()}
                </div>
            </div>

            {showRatePassengerModal && lastCompletedTripId && (
                <RatePassengerModal
                    tripId={lastCompletedTripId}
                    onClose={() => setShowRatePassengerModal(false)}
                    onSubmit={handleRatePassenger}
                />
            )}
        </div>
    );
};

export default MapScreen;