import React from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Building, FileText, Star, TrendingUp, Clock, CheckCircle, AlertTriangle, MessageSquare, Plus, Calendar, Flag, Trash2, Edit } from 'lucide-react';
import { Client, Loan } from '../types';
import { mockLoans } from '../data/mockData';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface ClientDetailsProps {
  client: Client;
  onBack: () => void;
  onEdit: (client: Client) => void;
  onDelete: () => void;
  onUpdateClient: (client: Client) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onBack, onEdit, onDelete, onUpdateClient }) => {
  const [showAddObservation, setShowAddObservation] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [newObservation, setNewObservation] = React.useState({
    content: '',
    type: 'general' as const,
    isImportant: false
  });

  const { } = useRBAC();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStarRating = (score: number) => {
    if (score >= 850) return 5;
    if (score >= 700) return 4;
    if (score >= 500) return 3;
    if (score >= 300) return 2;
    return 1;
  };

  const getStarColor = (score: number) => {
    if (score >= 700) return 'text-green-500';
    if (score >= 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingText = (score: number) => {
    if (score >= 850) return 'Excelente Pagador';
    if (score >= 700) return 'Bom Pagador';
    if (score >= 500) return 'Risco Médio';
    if (score >= 300) return 'Risco Alto';
    return 'Risco Muito Alto';
  };

  const StarRating = ({ score }: { score: number }) => {
    const rating = getStarRating(score);
    const color = getStarColor(score);
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={`${star <= rating ? color : 'text-gray-300'} ${
              star <= rating ? 'fill-current' : ''
            }`}
          />
        ))}
      </div>
    );
  };
  const clientLoans = mockLoans.filter(loan => loan.clientId === client.id);

  const handleDeleteClick = () => {
    // Verificar se há empréstimos ativos
    const activeLoans = clientLoans.filter(loan => loan.status === 'active');
    
    if (activeLoans.length > 0) {
      alert(`Não é possível excluir o cliente. Existem ${activeLoans.length} empréstimo(s) ativo(s) vinculado(s).`);
      return;
    }
    
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };
  const handleAddObservation = () => {
    if (!newObservation.content.trim()) {
      alert('Por favor, digite uma observação');
      return;
    }

    const observation = {
      id: Date.now().toString(),
      content: newObservation.content,
      createdAt: new Date().toISOString(),
      createdBy: 'Usuário Atual', // Em produção, usar dados do usuário logado
      type: newObservation.type,
      isImportant: newObservation.isImportant
    };

    const updatedClient = {
      ...client,
      observations: [...(client.observations || []), observation]
    };

    onUpdateClient(updatedClient);
    setNewObservation({ content: '', type: 'general', isImportant: false });
    setShowAddObservation(false);
  };

  const getObservationTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800 border-green-200';
      case 'contact': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'credit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'warning': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getObservationTypeText = (type: string) => {
    switch (type) {
      case 'payment': return 'Pagamento';
      case 'contact': return 'Contato';
      case 'credit': return 'Crédito';
      case 'warning': return 'Atenção';
      default: return 'Geral';
    }
  };


  const DocumentStatus = ({ label, hasDocument }: { label: string; hasDocument: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {hasDocument ? (
          <>
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-600">Enviado</span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm text-red-600">Pendente</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cliente</h1>
        </div>
        <div className="flex gap-2">
          <RBACButton
            resource={RBAC_RESOURCES.CUSTOMERS}
            action={RBAC_ACTIONS.UPDATE}
            onClick={() => onEdit(client)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Editar Cliente
          </RBACButton>
          <RBACButton
            resource={RBAC_RESOURCES.CUSTOMERS}
            action={RBAC_ACTIONS.DELETE}
            onClick={handleDeleteClick}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} className="mr-2" />
            Excluir Cliente
          </RBACButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Nome Completo</label>
                <p className="font-medium text-gray-900">{client.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">CPF</label>
                <p className="font-medium text-gray-900">{client.cpf}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Telefone</label>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Phone size={16} />
                  {client.phone}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail size={16} />
                  {client.email || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : client.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800 border-gray-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {client.status === 'active' ? 'Ativo' : 
                   client.status === 'inactive' ? 'Inativo' : 'Impedido'}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-600">Cliente desde</label>
                <p className="font-medium text-gray-900">
                  {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Endereços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Residencial</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{client.residentialAddress.street}, {client.residentialAddress.number}</p>
                  {client.residentialAddress.complement && <p>{client.residentialAddress.complement}</p>}
                  <p>{client.residentialAddress.neighborhood}</p>
                  <p>{client.residentialAddress.city} - {client.residentialAddress.state}</p>
                  <p>CEP: {client.residentialAddress.zipCode}</p>
                  <div className="pt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${client.residentialAddress.street}, ${client.residentialAddress.number}, ${client.residentialAddress.neighborhood}, ${client.residentialAddress.city}, ${client.residentialAddress.state}, ${client.residentialAddress.zipCode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      <MapPin size={14} />
                      Ver no Google Maps
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Trabalho</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Building size={16} />
                    {client.workAddress.company || 'Não informado'}
                  </p>
                  {client.workAddress.street && (
                    <>
                      <p>{client.workAddress.street}, {client.workAddress.number}</p>
                      {client.workAddress.complement && <p>{client.workAddress.complement}</p>}
                      <p>{client.workAddress.neighborhood}</p>
                      <p>{client.workAddress.city} - {client.workAddress.state}</p>
                      <p>CEP: {client.workAddress.zipCode}</p>
                      <div className="pt-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${client.workAddress.company}, ${client.workAddress.street}, ${client.workAddress.number}, ${client.workAddress.neighborhood}, ${client.workAddress.city}, ${client.workAddress.state}, ${client.workAddress.zipCode}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                        >
                          <MapPin size={14} />
                          Ver no Google Maps
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Empréstimos */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico de Empréstimos</h2>
            {clientLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">ID</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Valor</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Progresso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{loan.id}</td>
                        <td className="px-4 py-3">{formatCurrency(loan.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            loan.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {loan.status === 'active' ? 'Ativo' : 
                             loan.status === 'completed' ? 'Finalizado' : 'Inadimplente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(loan.paidInstallments / loan.installments) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {loan.paidInstallments}/{loan.installments}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum empréstimo encontrado</p>
              </div>
            )}
          </div>

          {/* Observações Históricas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={20} />
                Observações Históricas
              </h2>
              <button
                onClick={() => setShowAddObservation(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} className="mr-2" />
                Nova Observação
              </button>
            </div>

            {/* Lista de Observações */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(client.observations || []).length > 0 ? (
                client.observations
                  ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((observation) => (
                    <div key={observation.id} className={`p-4 rounded-lg border ${
                      observation.isImportant ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getObservationTypeColor(observation.type)}`}>
                            {getObservationTypeText(observation.type)}
                          </span>
                          {observation.isImportant && (
                            <Flag className="text-yellow-600" size={16} />
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar size={12} className="mr-1" />
                          {new Date(observation.createdAt).toLocaleDateString('pt-BR')} às {new Date(observation.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{observation.content}</p>
                      <div className="text-xs text-gray-500">
                        Por: {observation.createdBy}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Nenhuma observação registrada</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione observações para manter o histórico do cliente</p>
                </div>
              )}
            </div>

            {/* Modal de Nova Observação */}
            {showAddObservation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Nova Observação</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Observação
                      </label>
                      <select
                        value={newObservation.type}
                        onChange={(e) => setNewObservation(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">Geral</option>
                        <option value="payment">Pagamento</option>
                        <option value="contact">Contato</option>
                        <option value="credit">Crédito</option>
                        <option value="warning">Atenção</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observação
                      </label>
                      <textarea
                        value={newObservation.content}
                        onChange={(e) => setNewObservation(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite sua observação sobre o cliente..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="important"
                        checked={newObservation.isImportant}
                        onChange={(e) => setNewObservation(prev => ({ ...prev, isImportant: e.target.checked }))}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="important" className="text-sm text-gray-700 flex items-center">
                        <Flag size={16} className="mr-1 text-yellow-600" />
                        Marcar como importante
                      </label>
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddObservation(false);
                        setNewObservation({ content: '', type: 'general', isImportant: false });
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddObservation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Salvar Observação
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score de Crédito */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={20} />
              Classificação de Crédito
            </h2>
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${getStarColor(client.creditScore)}`}>
                {client.creditScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">de 1000 pontos</div>
            </div>
            <div className="flex flex-col items-center mb-4">
              <StarRating score={client.creditScore} />
              <div className="text-sm text-gray-600 mt-2">
                {getStarRating(client.creditScore)} de 5 estrelas
              </div>
              <div className={`text-sm font-medium mt-1 ${getStarColor(client.creditScore)}`}>
                {getRatingText(client.creditScore)}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  client.creditScore >= 700 ? 'bg-green-500' :
                  client.creditScore >= 500 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(client.creditScore / 1000) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Estatísticas Financeiras */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Estatísticas
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Emprestado</span>
                <span className="font-medium">{formatCurrency(client.totalBorrowed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pago</span>
                <span className="font-medium text-green-600">{formatCurrency(client.totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Empréstimos Ativos</span>
                <span className="font-medium">{client.activeLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Empréstimos Finalizados</span>
                <span className="font-medium">{client.completedLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagamentos em Dia</span>
                <span className="font-medium text-green-600">{client.onTimePayments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagamentos Atrasados</span>
                <span className="font-medium text-red-600">{client.latePayments}</span>
              </div>
              {client.averagePaymentDelay > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Atraso Médio</span>
                  <span className="font-medium text-orange-600">{client.averagePaymentDelay} dias</span>
                </div>
              )}
            </div>
          </div>

          {/* Status dos Documentos */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Documentos
            </h2>
            <div className="space-y-3">
              <DocumentStatus label="Selfie" hasDocument={!!client.documents.selfie} />
              <DocumentStatus label="CNH" hasDocument={!!client.documents.cnh} />
              <DocumentStatus label="Comprovante de Residência" hasDocument={!!client.documents.proofOfResidence} />
              <DocumentStatus label="Contra Cheque" hasDocument={!!client.documents.payStub} />
              <DocumentStatus label="Carteira de Trabalho" hasDocument={!!client.documents.workCard} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-gray-600">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>?
                </p>
                
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div><strong>Empréstimos Totais:</strong> {client.totalLoans}</div>
                      <div><strong>Empréstimos Ativos:</strong> {client.activeLoans}</div>
                      <div><strong>Total Emprestado:</strong> {formatCurrency(client.totalBorrowed)}</div>
                    </div>
                  </div>
                  
                  {client.activeLoans > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Impossível Excluir</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        Cliente possui {client.activeLoans} empréstimo(s) ativo(s). Finalize ou cancele os empréstimos antes de excluir.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Atenção</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Todos os dados do cliente, incluindo histórico de empréstimos e observações, serão excluídos permanentemente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={client.activeLoans > 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {client.activeLoans > 0 ? 'Não é Possível Excluir' : 'Excluir Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;