import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getTransactions } from '../services/apiService';

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

const BalanceScreen: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const data = await getTransactions();
                setTransactions(data);
            } catch (err) {
                setError("Não foi possível carregar as transações.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, []);


    const dailyTotal = transactions
        .filter(t => t.type !== 'withdrawal' && !t.timestamp.includes('Ontem')) // Simple logic for demo
        .reduce((sum, t) => sum + t.amount, 0);
    
    const completedRides = transactions.filter(t => t.type === 'earning').length;

    const formattedDailyTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyTotal);


    return (
        <div className="h-full w-full bg-goly-dark text-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-goly-yellow mb-8">Meu Saldo</h1>

            <div className="bg-goly-blue p-6 rounded-xl shadow-lg mb-8 text-center">
                <p className="text-lg text-blue-200">Ganhos de Hoje</p>
                <p className="text-5xl font-extrabold text-white my-2">{formattedDailyTotal}</p>
                <p className="text-blue-200">{completedRides} Corridas Concluídas</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
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
        </div>
    );
};

export default BalanceScreen;