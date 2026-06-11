import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Busca.css';

const Busca = () => {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [geolocationSupported, setGeolocationSupported] = useState(false);
  const [especializacoes, setEspecializacoes] = useState([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    cidade: '',
    estado: '',
    especialidade: '',
    precoMin: '',
    precoMax: '',
    raio: '50',
    ordenarPor: 'avaliacao'
  });

  const [, setLocalizacao] = useState({
    latitude: null,
    longitude: null
  });

  const [, setUsarGPS] = useState(false);

  // Verificar suporte a Geolocation
  useEffect(() => {
    setGeolocationSupported('geolocation' in navigator);
    carregarEspecialidades();
  }, []);

  // Carregar especialidades disponíveis
  const carregarEspecialidades = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/busca/especialidades'
      );
      setEspecializacoes(response.data.especialidades);
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  // Obter localização do GPS
  const obterLocalizacao = () => {
    if (!geolocationSupported) {
      alert('Seu navegador não suporta geolocalização');
      return;
    }

    setCarregando(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocalizacao({ latitude, longitude });
        setUsarGPS(true);
        buscarPrestadoresComGPS(latitude, longitude);
      },
      (error) => {
        alert('Erro ao obter localização: ' + error.message);
        setCarregando(false);
      }
    );
  };

  // Buscar prestadores com GPS
  const buscarPrestadoresComGPS = async (lat, lon) => {
    try {
      setCarregando(true);
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        raio: filtros.raio,
        ordenarPor: filtros.ordenarPor
      });

      if (filtros.especialidade) params.append('especialidade', filtros.especialidade);
      if (filtros.precoMin) params.append('precoMin', filtros.precoMin);
      if (filtros.precoMax) params.append('precoMax', filtros.precoMax);

      const response = await axios.get(
        `http://localhost:5000/api/busca/prestadores/localizacao?${params}`
      );

      setPrestadores(response.data.prestadores);
    } catch (error) {
      alert('Erro ao buscar prestadores: ' + error.response?.data?.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  // Buscar prestadores por cidade
  const buscarPorCidade = async (e) => {
    e.preventDefault();

    if (!filtros.cidade) {
      alert('Digite uma cidade');
      return;
    }

    try {
      setCarregando(true);
      const params = new URLSearchParams({
        cidade: filtros.cidade,
        ordenarPor: filtros.ordenarPor
      });

      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.especialidade) params.append('especialidade', filtros.especialidade);
      if (filtros.precoMin) params.append('precoMin', filtros.precoMin);
      if (filtros.precoMax) params.append('precoMax', filtros.precoMax);

      const response = await axios.get(
        `http://localhost:5000/api/busca/prestadores/cidade?${params}`
      );

      setPrestadores(response.data.prestadores);
      setUsarGPS(false);
    } catch (error) {
      alert('Erro ao buscar prestadores: ' + error.response?.data?.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const irParaPerfil = (prestadorId) => {
    navigate(`/prestador/${prestadorId}`);
  };

  return (
    <div className="busca-container">
      <div className="busca-header">
        <h1>🔍 Encontre Profissionais Confiáveis</h1>
        <p>Use o GPS ou busque por cidade para encontrar prestadores próximos a você.</p>
      </div>

      <div className="busca-filtros">
        <button
          type="button"
          onClick={obterLocalizacao}
          disabled={!geolocationSupported || carregando}
        >
          {carregando ? 'Buscando localização...' : 'Buscar com GPS'}
        </button>

        <form onSubmit={buscarPorCidade}>
          <input
            type="text"
            name="cidade"
            value={filtros.cidade}
            onChange={handleFiltroChange}
            placeholder="Cidade"
          />
          <input
            type="text"
            name="estado"
            value={filtros.estado}
            onChange={handleFiltroChange}
            placeholder="Estado"
          />
          <select
            name="especialidade"
            value={filtros.especialidade}
            onChange={handleFiltroChange}
          >
            <option value="">Todas as especialidades</option>
            {especializacoes.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="precoMin"
            value={filtros.precoMin}
            onChange={handleFiltroChange}
            placeholder="Preço mínimo"
          />
          <input
            type="number"
            name="precoMax"
            value={filtros.precoMax}
            onChange={handleFiltroChange}
            placeholder="Preço máximo"
          />
          <select
            name="ordenarPor"
            value={filtros.ordenarPor}
            onChange={handleFiltroChange}
          >
            <option value="avaliacao">Melhor avaliação</option>
            <option value="preco">Menor preço</option>
          </select>
          <button type="submit" disabled={carregando}>
            Buscar por cidade
          </button>
        </form>
      </div>

      {carregando && <p>Carregando...</p>}

      <div className="busca-resultados">
        {!carregando && prestadores.length === 0 ? (
          <p>Nenhum prestador encontrado.</p>
        ) : (
          prestadores.map((prestador) => (
            <div
              key={prestador.id || prestador._id}
              className="prestador-card"
              onClick={() => irParaPerfil(prestador.id || prestador._id)}
            >
              <h2>{prestador.nome}</h2>
              {prestador.especialidade && <p>{prestador.especialidade}</p>}
              {prestador.avaliacao && <p>Avaliação: {prestador.avaliacao}</p>}
              {prestador.preco && <p>Preço: R$ {prestador.preco}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Busca;
