

import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
// Fix: Removed direct import of requestWithdrawal from apiService as the call will be handled by the parent component.
// import { requestWithdrawal } from '../services/apiService'; 

interface WithdrawalModalProps {
    onClose: () => void;
    onWithdrawal: (amount: number, pixKey: string) => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ onClose, onWithdrawal }) => {
    const [amount, setAmount] = useState<string>('');
    const [pixKey, setPixKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9,.]/g, ''); // Allow only numbers, comma, dot
        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const parsedAmount = parseFloat(amount.replace(',', '.')); // Handle comma as decimal separator

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Por favor, insira um valor válido e maior que zero.');
            return;
        }
        if (!pixKey.trim()) {
            setError('Por favor, insira sua chave Pix.');
            return;
        }

        setIsLoading(true);
        try {
            // Fix: Call the onWithdrawal prop directly, which is provided by the parent BalanceScreen
            // and already has access to loggedInUserEmail.
            await onWithdrawal(parsedAmount, pixKey); 
            setSuccessMessage('Saque solicitado com sucesso! Processamento instantâneo.');
            // Optionally close modal after a delay or success message
            setTimeout(onClose, 3000); 
        } catch (err) {
            // The onWithdrawal prop should handle its own errors, but providing a fallback here.
            setError('Erro ao solicitar saque. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="withdrawal-title">
            <div className="bg-gray-900 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="withdrawal-title" className="text-xl font-bold text-goly-yellow">Solicitar Saque (Pix)</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Fechar solicitação de saque">
                        <CloseIcon className="w-6 h-6 text-gray-300" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">Valor do Saque (R$)</label>
                        <input
                            type="text"
                            id="amount"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-goly-blue"
                            placeholder="Ex: 50,00"
                            inputMode="decimal"
                            disabled={isLoading || successMessage !== null}
                        />
                    </div>
                    <div>
                        <label htmlFor="pixKey" className="block text-sm font-medium text-gray-300 mb-2">Sua Chave Pix</label>
                        <input
                            type="text"
                            id="pixKey"
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                            placeholder="CPF, email, telefone ou chave aleatória"
                            disabled={isLoading || successMessage !== null}
                        />
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {successMessage && <p className="text-green-400 text-center">{successMessage}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || successMessage !== null}
                        className="w-full bg-goly-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Solicitando...' : 'Confirmar Saque'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WithdrawalModal;