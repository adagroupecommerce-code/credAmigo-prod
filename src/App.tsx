import React, { useState } from 'react';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import { useRBAC } from './hooks/useRBAC';
import RBACProtectedRoute from './components/RBACProtectedRoute';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LoanList from './components/LoanList';
import LoanDetails from './components/LoanDetails';
import LoanForm from './components/LoanForm';
import LoanCalculator from './components/LoanCalculator';
import BillingDashboard from './components/BillingDashboard';
import PaymentDetails from './components/PaymentDetails';
import CRMKanban from './components/CRMKanban';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientDetails from './components/ClientDetails';
import Settings from './components/Settings';
import FinancialDashboard from './components/FinancialDashboard';
import { Loan, Client, Prospect, Payment } from './types';
import { RBAC_RESOURCES, RBAC_ACTIONS } from './types/rbac';
import { initializeRBACUsers } from './data/rbacUsers';
import { calculateClientMetrics, updateClientMetricsInDatabase } from './utils/paymentUtils';
import { useClients } from './hooks/useClients';
import { useLoans } from './hooks/useLoans';
import { markInstallmentPaid, syncPaymentsFromLoan, getPaymentsByLoan } from './services/payments';

function App() {
  const auth = useAuthProvider();
  const { clients, loading: clientsLoading, createClient, updateClient, deleteClient, refetch: refetchClients } = useClients();
  const { loans, loading: loansLoading, createLoan, updateLoan, deleteLoan, refetch: refetchLoans } = useLoans();
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Inicializar usuários RBAC
  React.useEffect(() => {
    initializeRBACUsers();
  }, []);

  // Mostrar tela de login se não estiver autenticado
  if (!auth.authState.isAuthenticated) {
    return (
      <AuthContext.Provider value={auth}>
        <Login />
      </AuthContext.Provider>
    );
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSelectedLoan(null);
    setSelectedClient(null);
  };

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setCurrentView('loan-details');
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setCurrentView('payment-details');
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setCurrentView('edit-loan');
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('client-details');
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      await updateClient(updatedClient.id, updatedClient);
      setSelectedClient(updatedClient);
      await refetchClients();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente. Tente novamente.');
    }
  };

  const handleNewLoan = () => {
    setSelectedLoan(null);
    setCurrentView('new-loan');
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setCurrentView('new-client');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('edit-client');
  };

  const handleDeleteClient = async (clientId: string) => {
    // Verificar se o cliente tem empréstimos ativos
    const clientLoans = loans.filter(l => l.clientId === clientId && l.status === 'active');

    if (clientLoans.length > 0) {
      alert(`Não é possível excluir o cliente. Existem ${clientLoans.length} empréstimo(s) ativo(s) vinculado(s) a este cliente.`);
      return;
    }

    try {
      await deleteClient(clientId);

      // Se o cliente excluído estava selecionado, voltar para a lista
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        setCurrentView('clients');
      }

      await refetchClients();
      await refetchLoans();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente. Tente novamente.');
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja EXCLUIR permanentemente o empréstimo de ${loan.clientName}?\n\n` +
      `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.amount)}\n\n` +
      `Esta ação não pode ser desfeita!\n\n` +
      `O valor será devolvido para a conta bancária.`
    );

    if (!confirmDelete) return;

    try {
      console.log('🗑️ Excluindo empréstimo:', loanId);

      // Importar função de exclusão com reversão financeira
      const { deleteLoanWithReversal } = await import('./services/loans');
      await deleteLoanWithReversal(loanId);

      // Se o empréstimo excluído estava selecionado, voltar para a lista
      if (selectedLoan?.id === loanId) {
        setSelectedLoan(null);
        setCurrentView('loans');
      }

      // Recarregar loans e atualizar dashboard
      await refetchLoans();

      console.log('✅ Empréstimo excluído com sucesso!');
      alert(`Empréstimo de ${loan.clientName} excluído com sucesso!\n\nO valor foi devolvido para a conta bancária.`);

      // Disparar evento para atualizar módulo financeiro
      window.dispatchEvent(new CustomEvent('financial-update'));
    } catch (error) {
      console.error('❌ Erro ao excluir empréstimo:', error);
      alert('Erro ao excluir empréstimo. Tente novamente.');
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    console.log('🚀 Iniciando salvamento do cliente:', clientData);

    try {
      if (selectedClient) {
        console.log('📝 Editando cliente existente:', selectedClient.id);
        await updateClient(selectedClient.id, { ...selectedClient, ...clientData });
        console.log('✅ Cliente atualizado com sucesso!');
      } else {
        console.log('➕ Criando novo cliente');
        await createClient(clientData);
        console.log('✅ Cliente criado com sucesso!');
      }

      await refetchClients();
      setCurrentView('clients');
      setSelectedClient(null);
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const handleSaveLoan = async (loanData: Partial<Loan>) => {
    console.log('Salvando empréstimo com plano personalizado:', loanData);

    try {
      if (selectedLoan) {
        console.log('📝 Editando empréstimo existente:', selectedLoan.id);
        await updateLoan(selectedLoan.id, { ...selectedLoan, ...loanData });
        console.log('✅ Empréstimo atualizado com sucesso!');
      } else {
        console.log('➕ Criando novo empréstimo');
        await createLoan(loanData);
        console.log('✅ Empréstimo criado com sucesso!');
      }

      await refetchLoans();
      await refetchClients(); // Atualizar métricas do cliente
      setCurrentView('loans');
      setSelectedLoan(null);
    } catch (error) {
      console.error('❌ Erro ao salvar empréstimo:', error);
      alert('Erro ao salvar empréstimo. Tente novamente.');
    }
  };

  const handleCancelLoan = () => {
    setCurrentView('loans');
    setSelectedLoan(null);
  };

  const handleConvertProspectToClient = async (prospect: Prospect) => {
    try {
      // Converter prospect em cliente
      const newClient: Partial<Client> = {
      id: Date.now().toString(),
      name: prospect.name,
      cpf: prospect.cpf || '',
      email: prospect.email || '',
      phone: prospect.phone,
      residentialAddress: prospect.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      workAddress: {
        company: prospect.workInfo?.company || '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      documents: {
        selfie: prospect.documents.selfie ? (
          prospect.documentFiles?.selfie instanceof File 
            ? prospect.documentFiles.selfie.name 
            : 'selfie.jpg'
        ) : undefined,
        cnh: prospect.documents.cnh ? (
          prospect.documentFiles?.cnh instanceof File 
            ? prospect.documentFiles.cnh.name 
            : 'cnh.jpg'
        ) : undefined,
        proofOfResidence: prospect.documents.proofOfResidence ? (
          prospect.documentFiles?.proofOfResidence instanceof File 
            ? prospect.documentFiles.proofOfResidence.name 
            : 'comprovante.pdf'
        ) : undefined,
        payStub: prospect.documents.payStub ? (
          prospect.documentFiles?.payStub instanceof File 
            ? prospect.documentFiles.payStub.name 
            : 'holerite.pdf'
        ) : undefined,
        workCard: prospect.documents.workCard ? (
          prospect.documentFiles?.workCard instanceof File 
            ? prospect.documentFiles.workCard.name 
            : 'carteira.jpg'
        ) : undefined
      },
      createdAt: new Date().toISOString(),
      status: 'active',
      creditScore: calculateCreditScoreFromProspect(prospect),
      creditRating: getCreditRatingFromScore(calculateCreditScoreFromProspect(prospect)),
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      defaultedLoans: 0,
      totalBorrowed: 0,
      totalPaid: 0,
      onTimePayments: 0,
      latePayments: 0,
      averagePaymentDelay: 0
      };

      await createClient(newClient);
      await refetchClients();
      setCurrentView('clients');
      alert(`Prospect ${prospect.name} convertido em cliente com sucesso! Todos os documentos foram importados automaticamente.`);
    } catch (error) {
      console.error('Erro ao converter prospect:', error);
      alert('Erro ao converter prospect em cliente. Tente novamente.');
    }
  };

  const calculateCreditScoreFromProspect = (prospect: Prospect): number => {
    let score = 400; // Score base
    
    // Pontuação por documentos
    if (prospect.documents.selfie) score += 50;
    if (prospect.documents.cnh) score += 100;
    if (prospect.documents.proofOfResidence) score += 75;
    if (prospect.documents.payStub) score += 150;
    if (prospect.documents.workCard) score += 100;
    
    // Pontuação por dados completos
    if (prospect.workInfo?.company) score += 75;
    if (prospect.email) score += 25;
    if (prospect.cpf) score += 50;
    if (prospect.address) score += 50;
    
    return Math.min(score, 1000);
  };

  const getCreditRatingFromScore = (score: number): Client['creditRating'] => {
    if (score >= 850) return 'excellent';
    if (score >= 700) return 'good';
    if (score >= 500) return 'fair';
    if (score >= 300) return 'poor';
    return 'very_poor';
  };

  // Função para atualizar empréstimo e propagar mudanças
  const handleUpdateLoan = async (updatedLoan: Loan) => {
    try {
      console.log('🔄 Atualizando empréstimo:', updatedLoan.id);

      // 1. Atualizar no Supabase
      await updateLoan(updatedLoan.id, updatedLoan);
      console.log('💾 Empréstimo salvo no Supabase');

      // 2. Recalcular métricas do cliente
      const { calculateClientMetrics, updateClientMetricsInDatabase } = await import('./utils/paymentUtils');
      const clientMetrics = calculateClientMetrics(updatedLoan.clientId, loans);
      console.log('📊 Métricas do cliente recalculadas:', clientMetrics);

      // 3. Atualizar métricas no Supabase
      await updateClientMetricsInDatabase(updatedLoan.clientId, clientMetrics);
      console.log('✅ Métricas salvas no Supabase');

      // 4. Recarregar dados
      await refetchLoans();
      await refetchClients();

      // 5. Atualizar estado local
      setSelectedLoan(updatedLoan);
      if (selectedClient?.id === updatedLoan.clientId) {
        setSelectedClient(prev => prev ? { ...prev, ...clientMetrics } : null);
      }

    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    }
  };

  const handleBack = () => {
    if (selectedLoan) {
      setSelectedLoan(null);
      setCurrentView('loans');
    } else if (selectedClient) {
      setSelectedClient(null);
      setCurrentView('clients');
    } else if (selectedPayment) {
      setSelectedPayment(null);
      setCurrentView('billing');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.DASHBOARD} action={RBAC_ACTIONS.READ}>
            <Dashboard />
          </RBACProtectedRoute>
        );
      case 'loans':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.LOANS} action={RBAC_ACTIONS.READ}>
            <LoanList 
              onViewLoan={handleViewLoan} 
              onNewLoan={handleNewLoan}
              onEditLoan={handleEditLoan}
              onDeleteLoan={handleDeleteLoan}
              loans={loans}
              clients={clients}
            />
          </RBACProtectedRoute>
        );
      case 'loan-details':
        return selectedLoan ? (
          <RBACProtectedRoute resource={RBAC_RESOURCES.LOANS} action={RBAC_ACTIONS.READ}>
            <LoanDetails 
              loan={selectedLoan} 
              onBack={handleBack}
              onUpdateLoan={handleUpdateLoan}
            />
          </RBACProtectedRoute>
        ) : null;
      case 'new-loan':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.LOANS} action={RBAC_ACTIONS.CREATE}>
            <LoanForm
              clients={clients}
              onSave={handleSaveLoan}
              onCancel={handleCancelLoan}
            />
          </RBACProtectedRoute>
        );
      case 'edit-loan':
        return selectedLoan ? (
          <RBACProtectedRoute resource={RBAC_RESOURCES.LOANS} action={RBAC_ACTIONS.UPDATE}>
            <LoanForm
              clients={clients}
              loan={selectedLoan}
              onSave={handleSaveLoan}
              onCancel={handleCancelLoan}
              isEditing={true}
            />
          </RBACProtectedRoute>
        ) : null;
      case 'clients':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.CUSTOMERS} action={RBAC_ACTIONS.READ}>
            <ClientList 
              onNewClient={handleNewClient} 
              onViewClient={handleViewClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              clients={clients}
            />
          </RBACProtectedRoute>
        );
      case 'client-details':
        return selectedClient ? (
          <RBACProtectedRoute resource={RBAC_RESOURCES.CUSTOMERS} action={RBAC_ACTIONS.READ}>
            <ClientDetails 
              client={selectedClient} 
              onBack={handleBack}
              onEdit={handleEditClient}
              onDelete={() => handleDeleteClient(selectedClient.id)}
              onUpdateClient={handleUpdateClient}
            />
          </RBACProtectedRoute>
        ) : null;
      case 'new-client':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.CUSTOMERS} action={RBAC_ACTIONS.CREATE}>
            <ClientForm 
              onSave={handleSaveClient}
              onCancel={handleBack}
            />
          </RBACProtectedRoute>
        );
      case 'edit-client':
        return selectedClient ? (
          <RBACProtectedRoute resource={RBAC_RESOURCES.CUSTOMERS} action={RBAC_ACTIONS.UPDATE}>
            <ClientForm 
              client={selectedClient}
              onSave={handleSaveClient}
              onCancel={handleBack}
              isEditing={true}
            />
          </RBACProtectedRoute>
        ) : null;
      case 'calculator':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.SIMULATOR} action={RBAC_ACTIONS.READ}>
            <LoanCalculator />
          </RBACProtectedRoute>
        );
      case 'billing':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.COLLECTIONS} action={RBAC_ACTIONS.READ}>
            <BillingDashboard 
              onViewPayment={handleViewPayment}
              onDeletePayment={(paymentId) => {
                // Aqui você removeria o pagamento do estado global
                console.log('Excluindo pagamento:', paymentId);
                // Em produção, fazer chamada para API/banco de dados
              }}
            />
          </RBACProtectedRoute>
        );
      case 'payment-details':
        return selectedPayment ? (
          <RBACProtectedRoute resource={RBAC_RESOURCES.COLLECTIONS} action={RBAC_ACTIONS.READ}>
            <PaymentDetails
              payment={selectedPayment}
              onBack={handleBack}
              onUpdatePayment={async (paymentId, status, paymentDate) => {
                try {
                  // ✅ Persistir pagamento no Supabase
                  await markInstallmentPaid(paymentId, {
                    payment_date: paymentDate || new Date().toISOString(),
                    total: Number(selectedPayment.amount),
                    principal_amount: Number(selectedPayment.principalAmount || 0),
                    interest_amount: Number(selectedPayment.interestAmount || 0),
                    penalty: Number(selectedPayment.penalty || 0)
                  });

                  console.log('✅ Pagamento salvo no Supabase!');

                  // Opcional: sincronizar installment_plan
                  await syncPaymentsFromLoan(selectedPayment.loanId).catch(() => {});

                  // Re-fetch payments do banco (FONTE DE VERDADE)
                  await getPaymentsByLoan(selectedPayment.loanId);

                  // Recarregar dados dos loans
                  await refetchLoans();

                  handleBack();
                } catch (error) {
                  console.error('❌ Erro ao salvar pagamento:', error);
                  alert('Erro ao salvar pagamento. Verifique o console.');
                }
              }}
            />
          </RBACProtectedRoute>
        ) : null;
      case 'crm':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.CRM} action={RBAC_ACTIONS.READ}>
            <CRMKanban onConvertToClient={handleConvertProspectToClient} />
          </RBACProtectedRoute>
        );
      case 'financial':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.FINANCE} action={RBAC_ACTIONS.READ}>
            <FinancialDashboard />
          </RBACProtectedRoute>
        );
      case 'reports':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.REPORTS} action={RBAC_ACTIONS.READ}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Relatórios</h2>
              <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            </div>
          </RBACProtectedRoute>
        );
      case 'settings':
        return (
          <RBACProtectedRoute resource={RBAC_RESOURCES.SETTINGS} action={RBAC_ACTIONS.READ}>
            <Settings />
          </RBACProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthContext.Provider value={auth}>
      <div className={`flex h-screen bg-gray-50 transition-all duration-300`}>
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <Header onToggleSidebar={() => setSidebarOpen(true)} />
          
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

export default App;