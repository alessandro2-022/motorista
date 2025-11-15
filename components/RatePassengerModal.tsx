
import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { StarIcon } from './icons/StarIcon'; // Assuming a StarIcon exists

interface RatePassengerModalProps {
    tripId: string;
    onClose: () => void;
    onSubmit: (rating: number, comment?: string) => void;
}

const RatePassengerModal: React.FC<RatePassengerModalProps> = ({ tripId, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Por favor, selecione uma avaliação.');
            return;
        }
        setIsSubmitting(true);
        await onSubmit(rating, comment);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="rate-title">
            <div className="bg-gray-900 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="rate-title" className="text-xl font-bold text-goly-yellow">Avaliar Passageiro</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Fechar avaliação">
                        <CloseIcon className="w-6 h-6 text-gray-300" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-lg text-white text-center">Como foi sua corrida?</p>
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-3xl transition-colors ${
                                    star <= rating ? 'text-goly-yellow' : 'text-gray-500'
                                } hover:text-goly-yellow`}
                                aria-label={`${star} estrelas`}
                            >
                                <StarIcon className="w-8 h-8"/>
                            </button>
                        ))}
                    </div>
                    <div>
                        <label htmlFor="comment" className="sr-only">Comentário opcional</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Adicione um comentário (opcional)"
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        ></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-b-xl">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="w-full bg-goly-blue text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatePassengerModal;
