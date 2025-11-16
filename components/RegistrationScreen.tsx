import React, { useState } from 'react';
import { registerUser } from '../services/apiService';

interface RegistrationScreenProps {
    onRegister: (email: string) => void;
    onNavigateToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, onNavigateToLogin }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await registerUser(email, password, fullName);
            if (response.success) {
                onRegister(email);
            } else {
                setError(response.message || 'Erro no cadastro. Tente novamente.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro na conexão. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full bg-goly-blue text-white flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-black text-4xl text-goly-yellow mb-6">
                G
            </div>
            <h1 className="text-4xl font-bold text-goly-yellow mb-8">Cadastre-se para Dirigir</h1>
            
            <form onSubmit={handleSubmit} className="bg-goly-dark p-8 rounded-xl shadow-lg w-full max-w-sm">
                <div className="mb-5">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2 sr-only">Nome Completo</label>
                    <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Nome Completo"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 sr-only">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Email"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 sr-only">Senha</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Senha"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2 sr-only">Confirmar Senha</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Confirmar Senha"
                        required
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-center mb-4">{error}</p>
                )}

                <button
                    type="submit"
                    className="w-full bg-goly-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-400">Já tem uma conta?</p>
                <button
                    onClick={onNavigateToLogin}
                    className="text-goly-yellow hover:text-yellow-300 font-medium transition-colors mt-2"
                    disabled={isLoading}
                >
                    Fazer Login
                </button>
            </div>
        </div>
    );
};

export default RegistrationScreen;