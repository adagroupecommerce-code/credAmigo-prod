import React, { useState } from 'react';
import { Plus, User, Phone, DollarSign, Calendar, FileText, CheckCircle, X, CreditCard as Edit, Eye, ArrowRight, AlertCircle, Clock, Target, Users, Filter, Upload, Download, Archive, Archive as Unarchive, Paperclip } from 'lucide-react';
import { Prospect } from '../types';
import { mockProspects } from '../data/mockProspects';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface CRMKanbanProps {
  onConvertToClient: (prospect: Prospect) => void;
}

const CRMKanban: React.FC<CRMKanbanProps> = ({ onConvertToClient }) => {
  const [prospects, setProspects] = useState<Prospect[]>(mockProspects);
  const [showNewProspectForm, setShowNewProspectForm] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showArchivedProspects, setShowArchivedProspects] = useState(false);
  const [draggedProspect, setDraggedProspect] = useState<Prospect | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [uploadingProspect, setUploadingProspect] = useState<Prospect | null>(null);

  // Filtros
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [approvalDateFilter, setApprovalDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({
    name: '',
    phone: '',
    email: '',
    requestedAmount: 0,
    priority: 'medium',
    source: 'website',
    notes: '',
    stage: 'lead'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stages = [
    {
      id: 'lead',
      title: 'Novos Leads',
      color: 'bg-blue-100 border-blue-300',
      headerColor: 'bg-blue-600',
      icon: Target,
      description: 'Prospects iniciais'
    },
    {
      id: 'documents',
      title: 'Enviando Documentos',
      color: 'bg-yellow-100 border-yellow-300',
      headerColor: 'bg-yellow-600',
      icon: FileText,
      description: 'Coletando documentação'
    },
    {
      id: 'analysis',
      title: 'Em Análise',
      color: 'bg-purple-100 border-purple-300',
      headerColor: 'bg-purple-600',
      icon: Clock,
      description: 'Análise de crédito'
    },
    {
      id: 'approved',
      title: 'Aprovados',
      color: 'bg-green-100 border-green-300',
      headerColor: 'bg-green-600',
      icon: CheckCircle,
      description: 'Prontos para conversão'
    },
    {
      id: 'rejected',
      title: 'Rejeitados',
      color: 'bg-red-100 border-red-300',
      headerColor: 'bg-red-600',
      icon: X,
      description: 'Não aprovados'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'website': return 'Website';
      case 'referral': return 'Indicação';
      case 'social_media': return 'Redes Sociais';
      case 'phone': return 'Telefone';
      case 'walk_in': return 'Presencial';
      case 'other': return 'Outros';
      default: return source;
    }
  };

  const filterProspectsByDate = (prospects: Prospect[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return prospects.filter(prospect => {
      // Filtrar arquivados se não estiver visualizando arquivados
      if (!showArchivedProspects && prospect.isArchived) return false;
      if (showArchivedProspects && !prospect.isArchived) return false;
      
      const createdDate = new Date(prospect.createdAt);
      const updatedDate = new Date(prospect.updatedAt);
      
      // Filtro por data de criação
      let passesCreationFilter = true;
      if (dateFilter === 'today') {
        passesCreationFilter = createdDate >= today;
      } else if (dateFilter === 'week') {
        passesCreationFilter = createdDate >= weekAgo;
      } else if (dateFilter === 'month') {
        passesCreationFilter = createdDate >= monthAgo;
      }

      // Filtro por data de aprovação (apenas para prospects aprovados)
      let passesApprovalFilter = true;
      if (approvalDateFilter !== 'all' && prospect.stage === 'approved') {
        if (approvalDateFilter === 'today') {
          passesApprovalFilter = updatedDate >= today;
        } else if (approvalDateFilter === 'week') {
          passesApprovalFilter = updatedDate >= weekAgo;
        } else if (approvalDateFilter === 'month') {
          passesApprovalFilter = updatedDate >= monthAgo;
        }
      }

      return passesCreationFilter && passesApprovalFilter;
    });
  };

  const filteredProspects = filterProspectsByDate(prospects);

  const handleCreateProspect = () => {
    if (!newProspect.name || !newProspect.phone) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    const prospect: Prospect = {
      ...newProspect,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: {},
      stage: 'lead'
    } as Prospect;

    setProspects([...prospects, prospect]);
    setNewProspect({
      name: '',
      phone: '',
      email: '',
      requestedAmount: 0,
      priority: 'medium',
      source: 'website',
      notes: '',
      stage: 'lead'
    });
    setShowNewProspectForm(false);
  };

  const handleMoveProspect = (prospectId: string, newStage: Prospect['stage']) => {
    setProspects(prospects.map(p => 
      p.id === prospectId 
        ? { ...p, stage: newStage, updatedAt: new Date().toISOString() }
        : p
    ));
  };

  // Funções de Drag and Drop
  const handleDragStart = (e: React.DragEvent, prospect: Prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
    setDraggedProspect(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Só remove o highlight se estiver saindo da área da coluna
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedProspect && draggedProspect.stage !== stageId) {
      handleMoveProspect(draggedProspect.id, stageId as Prospect['stage']);
    }
    setDraggedProspect(null);
  };
  const handleConvertToClient = (prospect: Prospect) => {
    // Criar objeto prospect com documentos para conversão
    const prospectWithDocs = {
      ...prospect,
      documentFiles: prospect.documentFiles || {}
    };
    onConvertToClient(prospectWithDocs);
    // Remove o prospect da lista após conversão
    setProspects(prospects.filter(p => p.id !== prospect.id));
  };

  const handleArchiveProspect = (prospectId: string) => {
    if (confirm('Tem certeza que deseja arquivar este prospect?')) {
      setProspects(prospects.map(p => 
        p.id === prospectId 
          ? { 
              ...p, 
              isArchived: true, 
              archivedAt: new Date().toISOString(),
              archivedBy: 'Usuário Atual' // Em produção, usar dados do usuário logado
            }
          : p
      ));
    }
  };

  const handleUnarchiveProspect = (prospectId: string) => {
    setProspects(prospects.map(p => 
      p.id === prospectId 
        ? { 
            ...p, 
            isArchived: false, 
            archivedAt: undefined,
            archivedBy: undefined
          }
        : p
    ));
  };

  const handleDocumentUpload = (documentType: string, file: File) => {
    if (!uploadingProspect) return;

    const updatedProspect = {
      ...uploadingProspect,
      documents: {
        ...uploadingProspect.documents,
        [documentType]: true
      },
      documentFiles: {
        ...uploadingProspect.documentFiles,
        [documentType]: file
      },
      updatedAt: new Date().toISOString()
    };

    setProspects(prospects.map(p => 
      p.id === uploadingProspect.id ? updatedProspect : p
    ));

    setUploadingProspect(updatedProspect);
  };

  const handleRemoveDocument = (documentType: string) => {
    if (!uploadingProspect) return;

    const updatedProspect = {
      ...uploadingProspect,
      documents: {
        ...uploadingProspect.documents,
        [documentType]: false
      },
      documentFiles: {
        ...uploadingProspect.documentFiles,
        [documentType]: undefined
      },
      updatedAt: new Date().toISOString()
    };

    setProspects(prospects.map(p => 
      p.id === uploadingProspect.id ? updatedProspect : p
    ));

    setUploadingProspect(updatedProspect);
  };

  const getDocumentProgress = (documents: Prospect['documents']) => {
    const total = 5; // Total de documentos possíveis
    const completed = Object.values(documents).filter(Boolean).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const ProspectCard = ({ prospect }: { prospect: Prospect }) => {
    const docProgress = getDocumentProgress(prospect.documents);
    const isDragging = draggedProspect?.id === prospect.id;
    const hasDocuments = Object.values(prospect.documents).some(Boolean);
    
    return (
      <div 
        draggable
        onDragStart={(e) => handleDragStart(e, prospect)}
        onDragEnd={handleDragEnd}
        className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-move relative ${
          isDragging ? 'opacity-50 transform rotate-2' : ''
        } ${prospect.isArchived ? 'bg-gray-50 border-gray-300' : ''}`}
      >
        {prospect.isArchived && (
          <div className="absolute top-1 right-1 bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded">
            Arquivado
          </div>
        )}
        
        {hasDocuments && !prospect.isArchived && (
          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
            <Paperclip size={12} />
          </div>
        )}
        
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-xs truncate">{prospect.name}</h4>
            <div className="flex items-center text-xs text-gray-600 mt-0.5">
              <Phone size={12} className="mr-1" />
              {prospect.phone}
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(prospect.priority)}`}>
            {getPriorityText(prospect.priority)}
          </span>
        </div>

        <div className="space-y-1.5 mb-2">
          <div className="flex items-center text-xs text-gray-700">
            <DollarSign size={14} className="mr-2 text-green-600" />
            {formatCurrency(prospect.requestedAmount)}
          </div>

          <div className="text-xs text-gray-500">
            <strong>Origem:</strong> {getSourceText(prospect.source)}
          </div>

          {prospect.stage !== 'lead' && (
            <div className="mt-1.5">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Documentos</span>
                <span>{docProgress.completed}/{docProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${docProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {new Date(prospect.createdAt).toLocaleDateString('pt-BR')}
            {prospect.stage === 'approved' && (
              <div className="text-green-600">
                Aprov: {new Date(prospect.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            )}
            {prospect.isArchived && (
              <div className="text-gray-600">
                Arq: {new Date(prospect.archivedAt!).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          <div className="flex gap-0.5 flex-wrap">
            {!prospect.isArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadingProspect(prospect);
                  setShowDocumentUpload(true);
                }}
                className="p-0.5 text-purple-600 hover:bg-purple-50 rounded"
                title="Gerenciar documentos"
              >
                <Upload size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProspect(prospect);
                setShowProspectDetails(true);
              }}
              className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
              title="Ver detalhes"
            >
              <Eye size={12} />
            </button>
            {prospect.stage === 'approved' && !prospect.isArchived && (
              <button
                onClick={() => handleConvertToClient(prospect)}
                className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                title="Converter em cliente"
              >
                <ArrowRight size={12} />
              </button>
            )}
            {prospect.stage === 'approved' && !prospect.isArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveProspect(prospect.id);
                }}
                className="p-0.5 text-orange-600 hover:bg-orange-50 rounded"
                title="Arquivar prospect"
              >
                <Archive size={12} />
              </button>
            )}
            {prospect.isArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnarchiveProspect(prospect.id);
                }}
                className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                title="Desarquivar prospect"
              >
                <Unarchive size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Prospecção CRM</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowArchivedProspects(!showArchivedProspects)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showArchivedProspects 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } touch-manipulation justify-center`}
          >
            {showArchivedProspects ? <Unarchive size={20} className="mr-2" /> : <Archive size={20} className="mr-2" />}
            {showArchivedProspects ? 'Ver Ativos' : 'Ver Arquivados'}
          </button>
          {!showArchivedProspects && (
            <RBACButton
              resource={RBAC_RESOURCES.CRM}
              action={RBAC_ACTIONS.CREATE}
              onClick={() => setShowNewProspectForm(true)}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              <Plus size={20} className="mr-2" />
              Novo Prospect
            </RBACButton>
          )}
        </div>
      </div>

      {/* Estatísticas e Filtros Combinados */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4">
          {stages.map((stage) => {
            const count = filteredProspects.filter(p => p.stage === stage.id).length;
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-600 truncate">{stage.title}</div>
                  </div>
                  <div className="p-1 sm:p-1.5 bg-white rounded">
                    <Icon className="text-gray-400" size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 pt-3 border-t border-gray-200">
          <Filter className="text-gray-600" size={20} />
          <h3 className="text-sm sm:text-base font-medium text-gray-900">Filtros</h3>
          <div className="sm:ml-auto text-xs sm:text-sm text-gray-600">
            Mostrando {filteredProspects.length} de {prospects.length} prospects
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Data de Criação
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
            >
              <option value="all">Todas as datas</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Data de Aprovação
            </label>
            <select
              value={approvalDateFilter}
              onChange={(e) => setApprovalDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
            >
              <option value="all">Todas as datas</option>
              <option value="today">Aprovados hoje</option>
              <option value="week">Aprovados na semana</option>
              <option value="month">Aprovados no mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {!showArchivedProspects ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {stages.map((stage) => {
            const stageProspects = filteredProspects.filter(p => p.stage === stage.id);
            const Icon = stage.icon;
            const isDropTarget = dragOverStage === stage.id;
            
            return (
              <div key={stage.id} className="flex-shrink-0 w-64 sm:w-72">
                <div 
                  className={`${stage.color} border-2 rounded-lg transition-all ${
                    isDropTarget ? 'border-blue-500 bg-blue-50 scale-105' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className={`${stage.headerColor} text-white p-4 rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Icon size={20} />
                        <h3 className="font-semibold text-xs sm:text-sm">{stage.title}</h3>
                      </div>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs sm:text-sm">
                        {stageProspects.length}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90 mt-1">{stage.description}</p>
                  </div>
                  
                  <div className={`p-4 space-y-3 min-h-[400px] transition-colors ${
                    isDropTarget ? 'bg-blue-25' : ''
                  }`} style={{ minHeight: '300px' }}>
                    {stageProspects.map((prospect) => (
                      <ProspectCard key={prospect.id} prospect={prospect} />
                    ))}
                    
                    {stageProspects.length === 0 && (
                      <div className={`text-center py-8 transition-colors ${
                        isDropTarget ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        <Icon size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">
                          {isDropTarget ? 'Solte o card aqui' : 'Nenhum prospect nesta etapa'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Lista de Prospects Arquivados */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Prospects Arquivados</h2>
            <p className="text-gray-600 mt-1">
              {filteredProspects.length} prospects arquivados
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProspects.map((prospect) => (
                <ProspectCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
            {filteredProspects.length === 0 && (
              <div className="text-center py-12">
                <Archive className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum prospect arquivado</h3>
                <p className="text-gray-600">Prospects aprovados arquivados aparecerão aqui</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Novo Prospect */}
      {showNewProspectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Novo Prospect</h2>
                <button
                  onClick={() => setShowNewProspectForm(false)}
                  className="text-gray-400 hover:text-gray-600 touch-manipulation"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={newProspect.name}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={newProspect.phone}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newProspect.email}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Valor Solicitado
                  </label>
                  <input
                    type="number"
                    value={newProspect.requestedAmount}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, requestedAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    placeholder="10000"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={newProspect.priority}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, priority: e.target.value as Prospect['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Origem
                  </label>
                  <select
                    value={newProspect.source}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, source: e.target.value as Prospect['source'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Indicação</option>
                    <option value="social_media">Redes Sociais</option>
                    <option value="phone">Telefone</option>
                    <option value="walk_in">Presencial</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={newProspect.notes}
                  onChange={(e) => setNewProspect(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  placeholder="Informações adicionais sobre o prospect..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowNewProspectForm(false)}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
              >
                Cancelar
              </button>
              <RBACButton
                resource={RBAC_RESOURCES.CRM}
                action={RBAC_ACTIONS.CREATE}
                onClick={handleCreateProspect}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-manipulation"
              >
                Criar Prospect
              </RBACButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Prospect */}
      {showProspectDetails && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do Prospect: {selectedProspect.name}
                </h2>
                <button
                  onClick={() => setShowProspectDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div><strong>Nome:</strong> {selectedProspect.name}</div>
                    <div><strong>Telefone:</strong> {selectedProspect.phone}</div>
                    {selectedProspect.email && <div><strong>Email:</strong> {selectedProspect.email}</div>}
                    {selectedProspect.cpf && <div><strong>CPF:</strong> {selectedProspect.cpf}</div>}
                    <div><strong>Valor Solicitado:</strong> {formatCurrency(selectedProspect.requestedAmount)}</div>
                    <div><strong>Origem:</strong> {getSourceText(selectedProspect.source)}</div>
                    <div><strong>Prioridade:</strong> {getPriorityText(selectedProspect.priority)}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Status dos Documentos</h3>
                  <div className="space-y-2">
                    {Object.entries({
                      selfie: 'Selfie',
                      cnh: 'CNH',
                      proofOfResidence: 'Comprovante de Residência',
                      payStub: 'Contra Cheque',
                      workCard: 'Carteira de Trabalho'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span>{label}</span>
                        {selectedProspect.documents[key as keyof typeof selectedProspect.documents] ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <AlertCircle className="text-red-600" size={16} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedProspect.notes && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedProspect.notes}</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Criado em: {new Date(selectedProspect.createdAt).toLocaleDateString('pt-BR')}
                  {selectedProspect.stage === 'approved' && (
                    <div className="text-green-600">
                      Aprovado em: {new Date(selectedProspect.updatedAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                {selectedProspect.stage === 'approved' && (
                  <button
                    onClick={() => {
                      handleConvertToClient(selectedProspect);
                      setShowProspectDetails(false);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <ArrowRight size={16} className="mr-2" />
                    Converter em Cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload de Documentos */}
      {showDocumentUpload && uploadingProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Documentos: {uploadingProspect.name}
                </h2>
                <button
                  onClick={() => {
                    setShowDocumentUpload(false);
                    setUploadingProspect(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'selfie', label: 'Selfie', icon: User },
                  { key: 'cnh', label: 'CNH', icon: FileText },
                  { key: 'proofOfResidence', label: 'Comprovante de Residência', icon: FileText },
                  { key: 'payStub', label: 'Contra Cheque', icon: FileText },
                  { key: 'workCard', label: 'Carteira de Trabalho', icon: FileText }
                ].map(({ key, label, icon: Icon }) => {
                  const hasDocument = uploadingProspect.documents[key as keyof typeof uploadingProspect.documents];
                  const documentFile = uploadingProspect.documentFiles?.[key as keyof typeof uploadingProspect.documentFiles];
                  
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon size={20} className="text-gray-600" />
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                        {hasDocument && (
                          <RBACButton
                            resource={RBAC_RESOURCES.CRM}
                            action={RBAC_ACTIONS.UPDATE}
                            onClick={() => handleRemoveDocument(key)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </RBACButton>
                        )}
                      </div>
                      
                      {hasDocument ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm text-green-800">
                            {documentFile instanceof File ? documentFile.name : 'Documento enviado'}
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
                              if (file) handleDocumentUpload(key, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Download size={16} />
                  <span className="font-medium">Importação Automática</span>
                </div>
                <p className="text-sm text-blue-600">
                  Quando este prospect for convertido em cliente, todos os documentos serão automaticamente 
                  importados para o cadastro do cliente, mantendo o histórico completo.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDocumentUpload(false);
                  setUploadingProspect(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMKanban;