import React, { useState } from 'react';
import { Plus, Search, Eye, Phone, Star, MapPin, Filter, Users, UserCheck, UserX, AlertTriangle, Trash2, CreditCard as Edit } from 'lucide-react';
import { Client } from '../types';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface ClientListProps {
  onNewClient: () => void;
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  clients: Client[];
}

const ClientList: React.FC<ClientListProps> = ({ onNewClient, onViewClient, onEditClient, onDeleteClient, clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<Client | null>(null);
  
  const { } = useRBAC();

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

  const handleDeleteClick = (client: Client) => {
    setShowDeleteModal(client);
  };

  const confirmDelete = () => {
    if (showDeleteModal) {
      onDeleteClient(showDeleteModal.id);
      setShowDeleteModal(null);
    }
  };
  const StarRating = ({ score }: { score: number }) => {
    const rating = getStarRating(score);
    const color = getStarColor(score);
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${star <= rating ? color : 'text-gray-300'} ${
              star <= rating ? 'fill-current' : ''
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredClients = clients.filter((client) =>
    (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     client.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || client.status === statusFilter) &&
    (ratingFilter === 'all' || getStarRating(client.creditScore).toString() === ratingFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={onNewClient}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
        >
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="blocked">Impedidos</option>
            </select>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } touch-manipulation`}
          >
            <Users size={14} className="mr-1 sm:mr-2" />
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } touch-manipulation`}
          >
            <UserCheck size={14} className="mr-1 sm:mr-2" />
            Ativos ({clients.filter(c => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-gray-100 text-gray-800 border border-gray-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } touch-manipulation`}
          >
            <UserX size={14} className="mr-1 sm:mr-2" />
            Inativos ({clients.filter(c => c.status === 'inactive').length})
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'blocked'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } touch-manipulation`}
          >
            <AlertTriangle size={14} className="mr-1 sm:mr-2" />
            Impedidos ({clients.filter(c => c.status === 'blocked').length})
          </button>
          
          {/* Filtros por Rating */}
          <div className="w-full border-t border-gray-200 pt-2 mt-2">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = clients.filter(c => getStarRating(c.creditScore) === rating).length;
                const stars = '⭐'.repeat(rating);
                
                return (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating.toString())}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ratingFilter === rating.toString()
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } touch-manipulation`}
                  >
                    <span className="mr-1 sm:mr-2 text-xs sm:text-sm">{stars}</span>
                    {rating} Estrelas ({count})
                  </button>
                );
              })}
              <button
                onClick={() => setRatingFilter('all')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  ratingFilter === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } touch-manipulation`}
              >
                Todas as Classificações
              </button>
            </div>
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
          >
            <option value="all">Todas as Classificações</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
            <option value="4">⭐⭐⭐⭐ (4 estrelas)</option>
            <option value="3">⭐⭐⭐ (3 estrelas)</option>
            <option value="2">⭐⭐ (2 estrelas)</option>
            <option value="1">⭐ (1 estrela)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs sm:text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                client.status === 'active' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : client.status === 'inactive'
                  ? 'bg-gray-100 text-gray-800 border border-gray-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {client.status === 'active' ? 'Ativo' : 
                 client.status === 'inactive' ? 'Inativo' : 'Impedido'}
              </span>
            </div>

            <div className="space-y-1 mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate" title={client.name}>
                {client.name}
              </h3>
              
              <div className="flex items-center text-xs sm:text-xs text-gray-600 mb-1">
                <Phone size={12} className="mr-1" />
                {client.phone}
              </div>
              
              <div className="flex items-center text-xs sm:text-xs text-gray-600 truncate">
                <MapPin size={12} className="mr-1" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${client.residentialAddress.street}, ${client.residentialAddress.number}, ${client.residentialAddress.neighborhood}, ${client.residentialAddress.city}, ${client.residentialAddress.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                  title="Ver localização no Google Maps"
                >
                  {client.residentialAddress.city}, {client.residentialAddress.state}
                </a>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Classificação</span>
                <span className={`font-medium ${getStarColor(client.creditScore)}`}>
                  {client.creditScore}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <StarRating score={client.creditScore} />
                <span className="text-xs text-gray-500">
                  {getStarRating(client.creditScore)}/5
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {getRatingText(client.creditScore)}
              </div>
            </div>

            {/* Resumo de Contratos */}
            <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-1 font-medium">Contratos</div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span className="font-semibold text-blue-600">{client.activeLoans}</span>
                    <span className="text-gray-500 ml-1">Ativos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="font-semibold text-green-600">{client.completedLoans}</span>
                    <span className="text-gray-500 ml-1">Quitados</span>
                  </div>
                  {client.defaultedLoans > 0 && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span className="font-semibold text-red-600">{client.defaultedLoans}</span>
                      <span className="text-gray-500 ml-1">Inadimpl.</span>
                    </div>
                  )}
                </div>
                <div className="text-gray-500">
                  Total: {client.totalLoans}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              Desde: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
            </div>

            <button
              onClick={() => onViewClient(client)}
              className="w-full flex items-center justify-center px-2 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-xs touch-manipulation"
            >
              <Eye size={14} className="mr-1" />
              Detalhes
            </button>
            
            {/* Botões de Ação */}
            <div className="flex gap-1 sm:gap-2 mt-2">
              <RBACButton
                resource={RBAC_RESOURCES.CUSTOMERS}
                action={RBAC_ACTIONS.UPDATE}
                onClick={() => onEditClient(client)}
                className="flex-1 flex items-center justify-center px-2 py-1 text-green-600 border border-green-200 rounded hover:bg-green-50 transition-colors text-xs touch-manipulation"
              >
                <Edit size={12} className="mr-1" />
                Editar
              </RBACButton>
              <RBACButton
                resource={RBAC_RESOURCES.CUSTOMERS}
                action={RBAC_ACTIONS.DELETE}
                onClick={() => handleDeleteClick(client)}
                className="flex-1 flex items-center justify-center px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-xs touch-manipulation"
              >
                <Trash2 size={12} className="mr-1" />
                Excluir
              </RBACButton>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Nenhum cliente encontrado</div>
          <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
        </div>
      )}

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
                  Tem certeza que deseja excluir o cliente <strong>{showDeleteModal.name}</strong>?
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Atenção</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Todos os empréstimos e dados relacionados também serão excluídos permanentemente.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <RBACButton
                  resource={RBAC_RESOURCES.CUSTOMERS}
                  action={RBAC_ACTIONS.DELETE}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  fallback={
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                    >
                      Sem Permissão
                    </button>
                  }
                >
                  Excluir Cliente
                </RBACButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;