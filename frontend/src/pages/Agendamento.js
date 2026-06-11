import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Agendamento.css';

const Agendamento = () => {
  const navigate = useNavigate();
  const { prestadorId } = useParams();
  const token = localStorage.getItem('token');
  const [prestador, setPrestador] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [data, setData] = useState(new Date());
  const [hora, setHora] = useState('09:00');
  const [duracao, setDuracao] = useState(60);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });

  useEffect(() => {
    if (!token) navigate('/login');

    const carregarPrestador = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/busca/prestadores/${prestadorId}`
        );
        setPrestador(response.data.prestador);
        setFormData((prevFormData) => ({
          ...prevFormData,
          endereco: response.data.prestador.endereco || prevFormData.endereco
        }));
      } catch (error) {
        alert('Erro ao carregar dados do prestador');
        navigate('/busca');
      } finally {
        setCarregando(false);
      }
    };

    carregarPrestador();
  }, [prestadorId, token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [pai, filho] = name.split('.');
      setFormData({
        ...formData,
        [pai]: {
          ...formData[pai],
          [filho]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const [horas, minutos] = hora.split(':');
      const dataInicio = new Date(data);
      dataInicio.setHours(parseInt(horas), parseInt(minutos), 0);

      const dataFim = new Date(dataInicio);
      dataFim.setMinutes(dataFim.getMinutes() + parseInt(duracao));

      const payload = {
        prestadorId,
        titulo: formData.titulo,
        descricao: formData.descricao,
        especialidade: prestador.especialidades[0],
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        endereco: formData.endereco
      };

      await axios.post(
        'http://localhost:5000/api/agendamentos',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Agendamento criado! Aguarde a confirmação do prestador.');
      navigate('/meus-agendamentos');
    } catch (error) {
      alert('❌ Erro ao agendar: ' + error.response?.data?.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return <div className="carregando">Carregando...</div>;

  const valorTotal = (duracao / 60) * (prestador?.precoHora || 0);

  return (
    <div className="agendamento-container">
      <div className="agendamento-card">
        <h1>📅 Agendar Serviço</h1>

        {/* DADOS DO PRESTADOR */}
        {prestador && (
          <div className="prestador-info">
            {prestador.fotoPerfil && (
              <img 
                src={`http://localhost:5000${prestador.fotoPerfil}`}
                alt={prestador.nome}
                className="foto-prestador"
              />
            )}
            <div className="info-texto">
              <h2>{prestador.nome}</h2>
              <p>⭐ {prestador.avaliacaoMedia.toFixed(1)} ({prestador.totalAvaliacoes} avaliações)</p>
              <p>💰 R$ {prestador.precoHora.toFixed(2)}/hora</p>
              <p>📍 {prestador.endereco?.cidade}, {prestador.endereco?.estado}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* DADOS DO SERVIÇO */}
          <fieldset>
            <legend>Informações do Serviço</legend>

            <div className="form-group">
              <label>Título do Serviço *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ex: Manutenção de encanamento"
                required
              />
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva o que precisa ser feito..."
                rows="4"
              />
            </div>
          </fieldset>

          {/* CALENDÁRIO E HORÁRIO */}
          <fieldset>
            <legend>Data e Horário</legend>

            <div className="calendario-section">
              <div className="calendario">
                <label>Selecione a data *</label>
                <Calendar
                  value={data}
                  onChange={setData}
                  minDate={new Date()}
                  locale="pt-BR"
                />
              </div>

              <div className="horario-duracao">
                <div className="form-group">
                  <label>Horário *</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duração (minutos) *</label>
                  <select
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    required
                  >
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h30</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                    <option value="240">4 horas</option>
                    <option value="480">8 horas (dia inteiro)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="data-selecionada">
              <p>
                📆 {data.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} às {hora}
              </p>
            </div>
          </fieldset>

          {/* ENDEREÇO */}
          <fieldset>
            <legend>Local do Atendimento</legend>

            <div className="form-group">
              <label>Rua *</label>
              <input
                type="text"
                name="endereco.rua"
                value={formData.endereco.rua}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Número *</label>
                <input
                  type="text"
                  name="endereco.numero"
                  value={formData.endereco.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Complemento</label>
                <input
                  type="text"
                  name="endereco.complemento"
                  value={formData.endereco.complemento}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Bairro *</label>
              <input
                type="text"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cidade *</label>
                <input
                  type="text"
                  name="endereco.cidade"
                  value={formData.endereco.cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="endereco.estado"
                  value={formData.endereco.estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="BA">BA</option>
                  <option value="RS">RS</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>CEP</label>
              <input
                type="text"
                name="endereco.cep"
                value={formData.endereco.cep}
                onChange={handleInputChange}
                placeholder="00000-000"
              />
            </div>
          </fieldset>

          {/* RESUMO E VALOR */}
          <div className="resumo">
            <h3>Resumo do Agendamento</h3>
            <div className="resumo-item">
              <span>Data e Hora:</span>
              <strong>
                {data.toLocaleDateString('pt-BR')} às {hora}
              </strong>
            </div>
            <div className="resumo-item">
              <span>Duração:</span>
              <strong>{duracao} minutos</strong>
            </div>
            <div className="resumo-item">
              <span>Valor/hora:</span>
              <strong>R$ {prestador?.precoHora.toFixed(2)}</strong>
            </div>
            <div className="resumo-item total">
              <span>Valor Total:</span>
              <strong>R$ {valorTotal.toFixed(2)}</strong>
            </div>
            <small>⏰ Prestador tem 24h para confirmar</small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={carregando}
              className="btn-primary"
            >
              {carregando ? 'Agendando...' : 'Agendar Serviço'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Agendamento;