import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CompletarPerfil.css';

const CompletarPerfil = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [tipoUsuario, setTipoUsuario] = useState('cliente');
  const [carregando, setCarregando] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    
    // Cliente
    cpf: '',
    dataNascimento: '',
    
    // Prestador
    descricao: '',
    especialidades: [],
    precoHora: '',
    
    // Endereço (ambos)
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    
    // Prestador
    documentos: {
      cpf: '',
      rg: '',
      cnpj: ''
    },
    
    dadosBancarios: {
      banco: '',
      agencia: '',
      conta: '',
      titular: ''
    }
  });

  const carregarPerfil = useCallback(async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/perfil/me',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const usuario = response.data.usuario;
      setTipoUsuario(usuario.tipoPerfil);
      setFormData(prevFormData => ({
        ...prevFormData,
        ...usuario,
        endereco: usuario.endereco || prevFormData.endereco,
        documentos: usuario.documentos || prevFormData.documentos,
        dadosBancarios: usuario.dadosBancarios || prevFormData.dadosBancarios
      }));
      
      if (usuario.fotoPerfil) {
        setFotoPreview(`http://localhost:5000${usuario.fotoPerfil}`);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    carregarPerfil();
  }, [token, navigate, carregarPerfil]);

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

  const handleEspecialidades = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      especialidades: value.split(',').map(e => e.trim())
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFoto = async () => {
    if (!foto) return;

    const formDataFoto = new FormData();
    formDataFoto.append('foto', foto);

    try {
      await axios.post(
        'http://localhost:5000/api/perfil/foto',
        formDataFoto,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setFoto(null);
      alert('Foto enviada com sucesso!');
    } catch (error) {
      alert('Erro ao enviar foto: ' + error.response?.data?.mensagem);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const endpoint = tipoUsuario === 'prestador' 
        ? '/api/perfil/prestador' 
        : '/api/perfil/cliente';

      await axios.put(
        `http://localhost:5000${endpoint}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      alert('Erro ao atualizar perfil: ' + error.response?.data?.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="completar-perfil-container">
      <div className="perfil-card">
        <h1>Completar Perfil</h1>

        {/* FOTO DE PERFIL */}
        <div className="foto-section">
          <div className="foto-preview">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" />
            ) : (
              <div className="foto-placeholder">
                <span>📷</span>
              </div>
            )}
          </div>
          
          <div className="foto-upload">
            <input
              type="file"
              id="foto"
              accept="image/*"
              onChange={handleFotoChange}
            />
            <label htmlFor="foto">Escolher foto</label>
            {foto && (
              <button 
                type="button" 
                onClick={uploadFoto}
                className="btn-upload-foto"
              >
                Enviar foto
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* DADOS BÁSICOS */}
          <fieldset>
            <legend>Dados Básicos</legend>
            
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Telefone *</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </fieldset>

          {/* DADOS ESPECÍFICOS DO CLIENTE */}
          {tipoUsuario === 'cliente' && (
            <fieldset>
              <legend>Dados Pessoais</legend>
              
              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="form-group">
                <label>Data de Nascimento</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento?.split('T')[0] || ''}
                  onChange={handleInputChange}
                />
              </div>
            </fieldset>
          )}

          {/* DADOS ESPECÍFICOS DO PRESTADOR */}
          {tipoUsuario === 'prestador' && (
            <>
              <fieldset>
                <legend>Dados Profissionais</legend>
                
                <div className="form-group">
                  <label>Descrição Profissional *</label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    placeholder="Descreva suas habilidades e experiência..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Especialidades (separadas por vírgula) *</label>
                  <input
                    type="text"
                    value={formData.especialidades.join(', ')}
                    onChange={handleEspecialidades}
                    placeholder="Encanamento, Hidráulica, Reparos..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preço/Hora (R$) *</label>
                  <input
                    type="number"
                    name="precoHora"
                    value={formData.precoHora}
                    onChange={handleInputChange}
                    placeholder="50.00"
                    step="0.01"
                    required
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Documentos</legend>
                
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    name="documentos.cpf"
                    value={formData.documentos.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="form-group">
                  <label>RG</label>
                  <input
                    type="text"
                    name="documentos.rg"
                    value={formData.documentos.rg}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>CNPJ (se houver)</label>
                  <input
                    type="text"
                    name="documentos.cnpj"
                    value={formData.documentos.cnpj}
                    onChange={handleInputChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Dados Bancários</legend>
                
                <div className="form-group">
                  <label>Banco *</label>
                  <input
                    type="text"
                    name="dadosBancarios.banco"
                    value={formData.dadosBancarios.banco}
                    onChange={handleInputChange}
                    placeholder="Ex: Nubank, Bradesco..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Agência *</label>
                  <input
                    type="text"
                    name="dadosBancarios.agencia"
                    value={formData.dadosBancarios.agencia}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Conta *</label>
                  <input
                    type="text"
                    name="dadosBancarios.conta"
                    value={formData.dadosBancarios.conta}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Titular *</label>
                  <input
                    type="text"
                    name="dadosBancarios.titular"
                    value={formData.dadosBancarios.titular}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </fieldset>
            </>
          )}

          {/* ENDEREÇO (AMBOS) */}
          <fieldset>
            <legend>Endereço</legend>
            
            <div className="form-row">
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
            </div>

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
                  {/* Adicione outros estados */}
                </select>
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={carregando}
              className="btn-primary"
            >
              {carregando ? 'Salvando...' : 'Salvar Perfil'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompletarPerfil;