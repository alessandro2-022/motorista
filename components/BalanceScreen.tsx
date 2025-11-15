
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getTransactions, requestWithdrawal } from '../services/apiService';
import WithdrawalModal from './WithdrawalModal'; // New import

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const isPositive = transaction.type !== 'withdrawal';
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);

    return (
        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
            <div>
                <p className="font-medium text-white">{transaction.description}</p>
                <p className="text-sm text-gray-400">{transaction.timestamp}</p>
            </div>
            <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formattedAmount.replace('R$', 'R$ ')}
            </p>
        </div>
    );
};

interface BalanceScreenProps {
    loggedInUserEmail: string;
}

const BalanceScreen: React.FC<BalanceScreenProps> = ({ loggedInUserEmail }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    const fetchTransactions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTransactions(loggedInUserEmail);
            setTransactions(data);
        } catch (err) {
            setError("Não foi possível carregar as transações.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [loggedInUserEmail]); // Re-fetch if loggedInUserEmail changes

    const handleWithdrawalSubmit = async (amount: number, pixKey: string) => {
        // This callback is called by the modal when a withdrawal is confirmed
        try {
            await requestWithdrawal(loggedInUserEmail, amount, pixKey);
            // After successful withdrawal, re-fetch transactions to update the list
            await fetchTransactions();
            setShowWithdrawalModal(false);
        } catch (err) {
            console.error("Erro ao solicitar saque:", err);
            // Error handling in modal already shows message, but good to log here
        }
    };

    const dailyEarnings = transactions
        .filter(t => (t.type === 'earning' || t.type === 'tip' || t.type === 'bonus') && !t.timestamp.includes('Ontem')) // Simple logic for demo
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Mock values for week and month
    const weeklyEarnings = dailyEarnings * 5; // Simplified for demo
    const monthlyEarnings = dailyEarnings * 20; // Simplified for demo

    const completedRidesToday = transactions.filter(t => t.type === 'earning' && !t.timestamp.includes('Ontem')).length;

    const formattedDailyEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyEarnings);
    const formattedWeeklyEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyEarnings);
    const formattedMonthlyEarnings = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyEarnings);


    return (
        <div className="h-full w-full bg-goly-dark text-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-goly-yellow mb-8">Meu Saldo</h1>

            <div className="bg-goly-blue p-6 rounded-xl shadow-lg mb-8 text-center">
                <p className="text-lg text-blue-200">Ganhos de Hoje</p>
                <p className="text-5xl font-extrabold text-white my-2">{formattedDailyEarnings}</p>
                <p className="text-blue-200">{completedRidesToday} Corridas Concluídas</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-blue-400 pt-4">
                    <div>
                        <p className="text-sm text-blue-200">Ganhos da Semana</p>
                        <p className="text-xl font-bold text-white">{formattedWeeklyEarnings}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-200">Ganhos do Mês</p>
                        <p className="text-xl font-bold text-white">{formattedMonthlyEarnings}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg mb-6">
                <h3 className="text-xl font-semibold mb-4">Transações Recentes</h3>
                {isLoading ? (
                    <div className="text-center text-gray-400">Carregando transações...</div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : (
                    <div className="space-y-3">
                        {transactions.length > 0 ? (
                           transactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
                        ) : (
                            <p className="text-center text-gray-400">Nenhuma transação recente.</p>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowWithdrawalModal(true)}
                className="w-full bg-goly-yellow text-goly-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors shadow-lg"
                aria-label="Solicitar Saque via Pix"
            >
                Solicitar Saque (Pix Instantâneo)
            </button>

            {showWithdrawalModal && (
                <WithdrawalModal 
                    onClose={() => setShowWithdrawalModal(false)} 
                    onWithdrawal={handleWithdrawalSubmit} 
                />
            )}
        </div>
    );
};

export default BalanceScreen;