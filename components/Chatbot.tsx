
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import { getChatResponse, getTextToSpeech } from '../services/geminiService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { SoundIcon } from './icons/SoundIcon';

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', text: 'Olá! Eu sou o assistente Goly IA. Como posso ajudar hoje?', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(true);
    const [useMaps, setUseMaps] = useState(false);
    const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const { playAudio, stopAudio, isPlaying } = useAudioPlayer();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (useMaps && !location) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLocationError(null);
                },
                (error) => {
                    setLocationError("Não foi possível obter a localização. Por favor, ative os serviços de localização.");
                    setUseMaps(false);
                }
            );
        }
    }, [useMaps, location]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const response = await getChatResponse(input, useSearch, useMaps, location ?? undefined);

        const botMessage: ChatMessage = { 
            id: (Date.now() + 1).toString(), 
            text: response.text, 
            sender: 'bot',
            sources: response.sources
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
    };
    
    const handleTTS = useCallback(async (text: string) => {
        if (isPlaying) {
            stopAudio();
            return;
        }
        const audioData = await getTextToSpeech(text);
        if (audioData) {
            playAudio(audioData);
        }
    }, [isPlaying, playAudio, stopAudio]);

    const SourceLink: React.FC<{source: GroundingSource}> = ({ source }) => (
        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="block text-xs bg-gray-700 hover:bg-gray-600 p-2 rounded-md truncate transition-colors">
            <span className="font-bold text-goly-yellow">{source.type === 'web' ? 'Web' : 'Mapa'}: </span>
            <span className="text-gray-300">{source.title}</span>
        </a>
    );

    return (
        <div className="h-full w-full bg-goly-dark text-white flex flex-col p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-goly-yellow mb-4">Assistente Goly IA</h1>
            
            <div className="flex-grow bg-gray-900 rounded-xl flex flex-col overflow-hidden">
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-goly-blue flex items-center justify-center font-bold text-goly-yellow text-sm flex-shrink-0">IA</div>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-goly-blue text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-600 space-y-1">
                                        {msg.sources.map((source, index) => <SourceLink key={index} source={source} />)}
                                    </div>
                                )}
                                {msg.sender === 'bot' && (
                                    <button onClick={() => handleTTS(msg.text)} className="mt-2 text-gray-400 hover:text-goly-yellow transition-colors">
                                        <SoundIcon className={`w-5 h-5 ${isPlaying ? 'text-goly-yellow' : ''}`}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                           <div className="w-8 h-8 rounded-full bg-goly-blue flex items-center justify-center font-bold text-goly-yellow text-sm flex-shrink-0">IA</div>
                            <div className="p-3 rounded-2xl bg-gray-700 rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                 {locationError && <p className="text-xs text-red-400 p-2 text-center">{locationError}</p>}
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center text-sm gap-2 cursor-pointer"><input type="checkbox" checked={useSearch} onChange={e => setUseSearch(e.target.checked)} className="form-checkbox bg-gray-700 border-gray-600 rounded text-goly-blue focus:ring-goly-blue"/> Usar Pesquisa Google</label>
                        <label className="flex items-center text-sm gap-2 cursor-pointer"><input type="checkbox" checked={useMaps} onChange={e => setUseMaps(e.target.checked)} className="form-checkbox bg-gray-700 border-gray-600 rounded text-goly-blue focus:ring-goly-blue"/> Usar Google Maps</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite sua mensagem..."
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-goly-yellow text-goly-dark font-bold px-5 py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
