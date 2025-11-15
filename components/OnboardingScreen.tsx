import React, { useState } from 'react';
import { DriverRegistrationData, DriverStatus } from '../types';
import { submitOnboardingData } from '../services/apiService';
import { InboxIcon } from './icons/InboxIcon'; // Placeholder for document icon

interface OnboardingScreenProps {
    driverStatus: DriverStatus;
    onComplete: (status: DriverStatus) => void;
    loggedInUserEmail: string; // New prop
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ driverStatus, onComplete, loggedInUserEmail }) => {
    const [formData, setFormData] = useState<DriverRegistrationData>({
        fullName: '',
        cnhNumber: '',
        crlvNumber: '',
        vehiclePlate: '',
        bankAccount: '',
        pixKey: '',
        cnhPhoto: null,
        crlvPhoto: null,
        vehiclePhoto: null,
        selfiePhoto: null,
        userEmail: loggedInUserEmail, // Set userEmail from prop
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    // Update formData.userEmail if loggedInUserEmail changes (shouldn't happen often, but for robustness)
    React.useEffect(() => {
        setFormData(prev => ({ ...prev, userEmail: loggedInUserEmail }));
    }, [loggedInUserEmail]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        // Basic validation
        const requiredFields: Array<keyof Omit<DriverRegistrationData, 'userEmail'>> = [
            'fullName', 'cnhNumber', 'crlvNumber', 'vehiclePlate', 'bankAccount', 'pixKey',
            'cnhPhoto', 'crlvPhoto', 'vehiclePhoto', 'selfiePhoto'
        ];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setSubmitError(`Por favor, preencha todos os campos e faça o upload de todos os documentos. Campos faltando: ${missingFields.join(', ')}`);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await submitOnboardingData(formData);
            if (response.success) {
                setSubmitSuccess(response.message);
                onComplete(DriverStatus.PENDING_APPROVAL); // Notify App.tsx of status change
            } else {
                setSubmitError(response.message || 'Erro ao enviar dados.');
            }
        } catch (err) {
            setSubmitError('Erro na conexão. Tente novamente.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFileField = (name: keyof DriverRegistrationData, label: string) => (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg p-3">
                <span className="text-gray-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap mr-2">
                    {formData[name] instanceof File ? (formData[name] as File).name : 'Nenhum arquivo selecionado'}
                </span>
                <input
                    type="file"
                    name={name}
                    id={name}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => document.getElementById(name)?.click()}
                    className="flex items-center bg-goly-blue text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <InboxIcon className="w-4 h-4 mr-2" />
                    Upload
                </button>
            </div>
        </div>
    );

    if (driverStatus === DriverStatus.PENDING_APPROVAL) {
        return (
            <div className="h-full w-full bg-goly-dark text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-3xl font-bold text-goly-yellow mb-4">Cadastro Enviado!</h1>
                <p className="text-lg text-gray-300 mb-8">
                    Seus documentos estão sob análise. Entraremos em contato assim que seu perfil for aprovado.
                </p>
                <div className="w-16 h-16 border-4 border-goly-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400 text-sm">Aguarde a aprovação para começar a dirigir.</p>
            </div>
        );
    }

    if (driverStatus === DriverStatus.REJECTED) {
        return (
            <div className="h-full w-full bg-goly-dark text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Cadastro Rejeitado</h1>
                <p className="text-lg text-gray-300 mb-8">
                    Infelizmente, seu cadastro foi rejeitado. Por favor, entre em contato com o suporte para mais informações.
                </p>
                <button 
                    onClick={() => { /* Optionally allow re-submission or contact support */ }}
                    className="bg-goly-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Contatar Suporte
                </button>
            </div>
        );
    }

    // Default: DriverStatus.PENDING_ONBOARDING
    return (
        <div className="h-full w-full bg-goly-dark text-white p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-goly-yellow mb-8">Cadastro de Motorista</h1>
            <p className="text-gray-300 mb-6">Preencha seus dados para começar a dirigir com a Goly.</p>

            <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl shadow-lg">
                <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Seu nome completo"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="cnhNumber" className="block text-sm font-medium text-gray-300 mb-2">Número da CNH (com EAR)</label>
                    <input
                        type="text"
                        name="cnhNumber"
                        id="cnhNumber"
                        value={formData.cnhNumber}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Ex: 12345678900"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="crlvNumber" className="block text-sm font-medium text-gray-300 mb-2">Número do CRLV</label>
                    <input
                        type="text"
                        name="crlvNumber"
                        id="crlvNumber"
                        value={formData.crlvNumber}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Ex: 1234567890"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-300 mb-2">Placa do Veículo</label>
                    <input
                        type="text"
                        name="vehiclePlate"
                        id="vehiclePlate"
                        value={formData.vehiclePlate}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Ex: ABC1234"
                    />
                </div>

                <h3 className="text-xl font-semibold text-goly-yellow mb-4 mt-6">Dados Bancários para Saque</h3>
                <div className="mb-4">
                    <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-300 mb-2">Conta Bancária</label>
                    <input
                        type="text"
                        name="bankAccount"
                        id="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="Agência e Conta (Ex: 0001-5 / 12345-6)"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="pixKey" className="block text-sm font-medium text-gray-300 mb-2">Chave Pix</label>
                    <input
                        type="text"
                        name="pixKey"
                        id="pixKey"
                        value={formData.pixKey}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-goly-blue"
                        placeholder="CPF, email, telefone ou chave aleatória"
                    />
                </div>

                <h3 className="text-xl font-semibold text-goly-yellow mb-4 mt-6">Upload de Documentos e Fotos</h3>
                {renderFileField('cnhPhoto', 'CNH com EAR (frente e verso)')}
                {renderFileField('crlvPhoto', 'CRLV do Veículo')}
                {renderFileField('vehiclePhoto', 'Foto do Veículo (frente)')}
                {renderFileField('selfiePhoto', 'Sua Selfie (para reconhecimento facial)')}

                {submitError && (
                    <p className="text-red-400 text-center mb-4">{submitError}</p>
                )}
                {submitSuccess && (
                    <p className="text-green-400 text-center mb-4">{submitSuccess}</p>
                )}

                <button
                    type="submit"
                    className="w-full bg-goly-yellow text-goly-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar Cadastro para Aprovação'}
                </button>
            </form>
            <p className="text-center text-gray-500 text-xs mt-6">A aprovação pode levar até 24 horas úteis.</p>
        </div>
    );
};

export default OnboardingScreen;