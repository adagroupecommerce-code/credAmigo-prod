import React, { useState } from 'react';
import { ArrowLeft, Upload, X, User, Phone, Mail, MapPin, Building, FileText, Camera, CreditCard, Save } from 'lucide-react';
import { Client } from '../types';

interface ClientFormProps {
  client?: Client;
  onSave: (client: Partial<Client>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: client?.name || '',
    cpf: client?.cpf || '',
    email: client?.email || '',
    phone: client?.phone || '',
    residentialAddress: client?.residentialAddress || {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    workAddress: client?.workAddress || {
      company: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    documents: client?.documents || {},
    status: client?.status || 'active'
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [activeTab, setActiveTab] = useState('personal');

  const handleInputChange = (field: string, value: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev] as any,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = (documentType: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [documentType]: file }));
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file.name
      }
    }));
  };

  const removeFile = (documentType: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: undefined
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.phone) {
      alert('Por favor, preencha os campos obrigatórios: Nome e Telefone');
      return;
    }

    // Calcular score de crédito baseado nos dados (simulação)
    const creditData = calculateCreditScore(formData);
    
    onSave({
      ...formData,
      ...creditData,
      id: client?.id || Date.now().toString(),
      createdAt: client?.createdAt || new Date().toISOString()
    });
  };

  const calculateCreditScore = (data: Partial<Client>) => {
    // Simulação de cálculo de score baseado nos documentos e dados
    let score = 400; // Score base
    
    // Pontuação por documentos enviados
    const docs = data.documents || {};
    if (docs.selfie) score += 50;
    if (docs.cnh) score += 100;
    if (docs.proofOfResidence) score += 75;
    if (docs.payStub) score += 150;
    if (docs.workCard) score += 100;
    
    // Pontuação por completude dos dados
    if (data.workAddress?.company) score += 75;
    if (data.email) score += 25;
    
    // Determinar rating baseado no score
    let rating: Client['creditRating'];
    if (score >= 850) rating = 'excellent';
    else if (score >= 700) rating = 'good';
    else if (score >= 500) rating = 'fair';
    else if (score >= 300) rating = 'poor';
    else rating = 'very_poor';

    return {
      creditScore: Math.min(score, 1000),
      creditRating: rating,
      totalLoans: client?.totalLoans || 0,
      activeLoans: client?.activeLoans || 0,
      completedLoans: client?.completedLoans || 0,
      defaultedLoans: client?.defaultedLoans || 0,
      totalBorrowed: client?.totalBorrowed || 0,
      totalPaid: client?.totalPaid || 0,
      onTimePayments: client?.onTimePayments || 0,
      latePayments: client?.latePayments || 0,
      averagePaymentDelay: client?.averagePaymentDelay || 0
    };
  };

  const DocumentUpload = ({ 
    type, 
    label, 
    icon: Icon, 
    required = false 
  }: { 
    type: string; 
    label: string; 
    icon: React.ElementType; 
    required?: boolean;
  }) => {
    const hasFile = formData.documents?.[type as keyof typeof formData.documents] || uploadedFiles[type];
    
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
          {hasFile && (
            <button
              type="button"
              onClick={() => removeFile(type)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {hasFile ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
            <FileText size={16} className="text-green-600" />
            <span className="text-sm text-green-800">
              {uploadedFiles[type]?.name || formData.documents?.[type as keyof typeof formData.documents]}
            </span>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Clique para enviar</span>
            <span className="text-xs text-gray-400">PNG, JPG ou PDF até 5MB</span>
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(type, file);
              }}
            />
          </label>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'addresses', label: 'Endereços', icon: MapPin },
    { id: 'documents', label: 'Documentos', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Dados Pessoais */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="blocked">Impedido</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Endereços */}
          {activeTab === 'addresses' && (
            <div className="space-y-8">
              {/* Endereço Residencial */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Endereço Residencial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rua/Avenida</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.street}
                      onChange={(e) => handleInputChange('street', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.number}
                      onChange={(e) => handleInputChange('number', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apto, Bloco, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.city}
                      onChange={(e) => handleInputChange('city', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.state}
                      onChange={(e) => handleInputChange('state', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <input
                      type="text"
                      value={formData.residentialAddress?.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value, 'residentialAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço do Trabalho */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building size={20} />
                  Endereço do Trabalho
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                    <input
                      type="text"
                      value={formData.workAddress?.company}
                      onChange={(e) => handleInputChange('company', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rua/Avenida</label>
                    <input
                      type="text"
                      value={formData.workAddress?.street}
                      onChange={(e) => handleInputChange('street', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                    <input
                      type="text"
                      value={formData.workAddress?.number}
                      onChange={(e) => handleInputChange('number', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                    <input
                      type="text"
                      value={formData.workAddress?.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                    <input
                      type="text"
                      value={formData.workAddress?.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      type="text"
                      value={formData.workAddress?.city}
                      onChange={(e) => handleInputChange('city', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <input
                      type="text"
                      value={formData.workAddress?.state}
                      onChange={(e) => handleInputChange('state', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <input
                      type="text"
                      value={formData.workAddress?.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value, 'workAddress')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <MapPin size={16} />
                        <span className="text-sm font-medium">Localização do Trabalho</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Endereço será vinculado ao Google Maps para facilitar localização
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documentos */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentUpload
                  type="selfie"
                  label="Selfie"
                  icon={Camera}
                  required
                />
                <DocumentUpload
                  type="cnh"
                  label="CNH (Carteira de Motorista)"
                  icon={CreditCard}
                />
                <DocumentUpload
                  type="proofOfResidence"
                  label="Comprovante de Residência"
                  icon={FileText}
                  required
                />
                <DocumentUpload
                  type="payStub"
                  label="Contra Cheque"
                  icon={FileText}
                  required
                />
                <DocumentUpload
                  type="workCard"
                  label="Carteira de Trabalho"
                  icon={FileText}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={20} className="mr-2" />
            {isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;