import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MeusAgendamentos.css';

const MeusAgendamentos = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, pendente, confirmado, concluido, cancelado
  const [tipoUsuario, setTipoUsuario] = useState('cliente');

  const carregarAgendamentos = useCallback(async (tipo) => {
    try {
      setCarregando(true);
      const endpoint = tipo === 'prestador' 
        ? '/api/agendamentos/prestador'
        : '/api/agendamentos/cliente';

      const response = await axios.get(
        `http://localhost:5000${endpoint}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAgendamentos(response.data.agendamentos);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      alert('Erro ao carregar agendamentos');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  const carregarUsuario = useCallback(async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/perfil/me',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTipoUsuario(response.data.usuario.tipoPerfil);
      carregarAgendamentos(response.data.usuario.tipoPerfil);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      navigate('/login');
    }
  }, [token, navigate, carregarAgendamentos]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    carregarUsuario();
  }, [token, navigate, carregarUsuario]);

  const cancelarAgendamento = async (agendamentoId) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await axios.post(
          `http://localhost:5000/api/agendamentos/${agendamentoId}/cancelar`,
          { motivo: 'Cancelado pelo usuário' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('✅ Agendamento cancelado com sucesso');
        carregarAgendamentos(tipoUsuario);
      } catch (error) {
        alert('❌ Erro ao cancelar: ' + error.response?.data?.mensagem);
      }
    }
  };

  const confirmarAgendamento = async (agendamentoId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/agendamentos/${agendamentoId}/confirmar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Agendamento confirmado com sucesso');
      carregarAgendamentos(tipoUsuario);
    } catch (error) {
      alert('❌ Erro ao confirmar: ' + error.response?.data?.mensagem);
    }
  };

  const getStatusColor = (status) => {
    const cores = {
      pendente: '#ffc107',
      confirmado: '#28a745',
      em_andamento: '#007bff',
      concluido: '#6c757d',
      cancelado: '#dc3545'
    };
    return cores[status] || '#6c757d';
  };

  const getStatusTexto = (status) => {
    const textos = {
      pendente: '⏳ Pendente',
      confirmado: '✅ Confirmado',
      em_andamento: '🔄 Em Andamento',
      concluido: '✔️ Concluído',
      cancelado: '❌ Cancelado'
    };
    return textos[status] || status;
  };

  const agendamentosFiltrados = filtro === 'todos' 
    ? agendamentos 
    : agendamentos.filter(a => a.status === filtro);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (carregando) return <div className="carregando">Carregando agendamentos...</div>;

  return (
    <div className="meus-agendamentos-container">
      <div className="meus-agendamentos-header">
        <h1>
          {tipoUsuario === 'prestador' ? '📅 Minha Agenda' : '📅 Meus Agendamentos'}
        </h1>
        <button 
          className="btn-voltar"
          onClick={() => navigate(tipoUsuario === 'prestador' ? '/dashboard' : '/busca')}
        >
          ← Voltar
        </button>
      </div>

      {/* FILTROS */}
      <div className="filtros">
        <button 
          className={`filtro-btn ${filtro === 'todos' ? 'ativo' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          Todos ({agendamentos.length})
        </button>
        <button 
          className={`filtro-btn ${filtro === 'pendente' ? 'ativo' : ''}`}
          onClick={() => setFiltro('pendente')}
        >
          ⏳ Pendentes
        </button>
        <button 
          className={`filtro-btn ${filtro === 'confirmado' ? 'ativo' : ''}`}
          onClick={() => setFiltro('confirmado')}
        >
          ✅ Confirmados
        </button>
        <button 
          className={`filtro-btn ${filtro === 'concluido' ? 'ativo' : ''}`}
          onClick={() => setFiltro('concluido')}
        >
          ✔️ Concluídos
        </button>
        <button 
          className={`filtro-btn ${filtro === 'cancelado' ? 'ativo' : ''}`}
          onClick={() => setFiltro('cancelado')}
        >
          ❌ Cancelados
        </button>
      </div>

      {/* LISTA DE AGENDAMENTOS */}
      <div className="agendamentos-lista">
        {agendamentosFiltrados.length === 0 ? (
          <div className="vazio">
            <p>😴 Nenhum agendamento neste status</p>
          </div>
        ) : (
          agendamentosFiltrados.map((agendamento) => (
            <div key={agendamento._id} className="agendamento-card">
              <div className="agendamento-header">
                <h3>{agendamento.titulo}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(agendamento.status) }}
                >
                  {getStatusTexto(agendamento.status)}
                </span>
              </div>

              <div className="agendamento-info">
                <div className="info-item">
                  <span className="label">
                    {tipoUsuario === 'prestador' ? '👤 Cliente:' : '👨‍🔧 Prestador:'}
                  </span>
                  <strong>
                    {tipoUsuario === 'prestador' 
                      ? agendamento.clienteId?.nome 
                      : agendamento.prestadorId?.nome}
                  </strong>
                </div>

                <div className="info-item">
                  <span className="label">📅 Data/Hora:</span>
                  <strong>{formatarData(agendamento.dataInicio)}</strong>
                </div>

                <div className="info-item">
                  <span className="label">⏱️ Duração:</span>
                  <strong>{agendamento.duracao} minutos</strong>
                </div>

                <div className="info-item">
                  <span className="label">💰 Valor:</span>
                  <strong>R$ {agendamento.valorTotal.toFixed(2)}</strong>
                </div>

                {tipoUsuario === 'prestador' && (
                  <div className="info-item">
                    <span className="label">🏦 Sua Renda:</span>
                    <strong>R$ {(agendamento.valorTotal - agendamento.comissaoPlatforma).toFixed(2)}</strong>
                    <small>(-R$ {agendamento.comissaoPlatforma.toFixed(2)} plataforma)</small>
                  </div>
                )}

                <div className="info-item">
                  <span className="label">📍 Local:</span>
                  <strong>
                    {agendamento.endereco?.rua}, {agendamento.endereco?.numero}
                    {agendamento.endereco?.cidade && ` - ${agendamento.endereco.cidade}`}
                  </strong>
                </div>
              </div>

              {agendamento.descricao && (
                <div className="agendamento-descricao">
                  <p>{agendamento.descricao}</p>
                </div>
              )}

              {/* PRAZOS */}
              {agendamento.status === 'pendente' && agendamento.prazoConfirmacao && (
                <div className="prazo-confirmacao">
                  <p>⏰ Prazo para confirmação: {formatarData(agendamento.prazoConfirmacao)}</p>
                </div>
              )}

              {/* AÇÕES */}
              <div className="agendamento-acoes">
                {tipoUsuario === 'prestador' && agendamento.status === 'pendente' && (
                  <>
                    <button 
                      className="btn-confirmar"
                      onClick={() => confirmarAgendamento(agendamento._id)}
                    >
                      ✅ Confirmar
                    </button>
                    <button 
                      className="btn-cancelar"
                      onClick={() => cancelarAgendamento(agendamento._id)}
                    >
                      ❌ Cancelar
                    </button>
                  </>
                )}

                {agendamento.status !== 'concluido' && agendamento.status !== 'cancelado' && (
                  <button 
                    className="btn-cancelar"
                    onClick={() => cancelarAgendamento(agendamento._id)}
                  >
                    ❌ Cancelar
                  </button>
                )}

                <button 
                  className="btn-detalhes"
                  onClick={() => navigate(`/agendamentos/${agendamento._id}`)}
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeusAgendamentos;