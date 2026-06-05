const User = require('../models/User');

// FUNÇÃO AUXILIAR: Calcular distância entre duas coordenadas (Haversine)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// BUSCAR PRESTADORES POR LOCALIZAÇÃO E FILTROS
exports.buscarPrestadores = async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      raio = 50, // padrão: 50km
      especialidade, 
      precoMax,
      precoMin,
      ordenarPor = 'distancia' // 'distancia', 'avaliacao', 'preco'
    } = req.query;

    let filtro = { 
      tipoPerfil: 'prestador', 
      ativo: true,
      'endereco.latitude': { $exists: true },
      'endereco.longitude': { $exists: true }
    };

    // Aplicar filtros de especialidade
    if (especialidade) {
      filtro.especialidades = { $in: [especialidade] };
    }

    // Aplicar filtros de preço
    if (precoMin || precoMax) {
      filtro.precoHora = {};
      if (precoMin) filtro.precoHora.$gte = parseFloat(precoMin);
      if (precoMax) filtro.precoHora.$lte = parseFloat(precoMax);
    }

    // Buscar prestadores
    const prestadores = await User.find(filtro)
      .select('-senha -documentos.cpf -documentos.cnpj -dadosBancarios');

    // Filtrar por distância e calcular distância
    let prestadoresComDistancia = [];

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const raioKm = parseFloat(raio);

      prestadoresComDistancia = prestadores
        .map(prestador => {
          const dist = calcularDistancia(
            lat,
            lon,
            prestador.endereco.latitude,
            prestador.endereco.longitude
          );
          return {
            ...prestador.toObject(),
            distancia: Math.round(dist * 100) / 100 // Arredondar para 2 casas decimais
          };
        })
        .filter(p => p.distancia <= raioKm);
    } else {
      prestadoresComDistancia = prestadores.map(p => ({
        ...p.toObject(),
        distancia: null
      }));
    }

    // Ordenar resultados
    if (ordenarPor === 'distancia' && latitude && longitude) {
      prestadoresComDistancia.sort((a, b) => a.distancia - b.distancia);
    } else if (ordenarPor === 'avaliacao') {
      prestadoresComDistancia.sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia);
    } else if (ordenarPor === 'preco') {
      prestadoresComDistancia.sort((a, b) => a.precoHora - b.precoHora);
    }

    res.json({
      sucesso: true,
      total: prestadoresComDistancia.length,
      raio: `${raio}km`,
      prestadores: prestadoresComDistancia
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar prestadores',
      erro: error.message
    });
  }
};

// BUSCAR POR CIDADE/BAIRRO (SEM GPS)
exports.buscarPorCidade = async (req, res) => {
  try {
    const { 
      cidade, 
      estado,
      especialidade, 
      precoMax,
      precoMin,
      ordenarPor = 'avaliacao'
    } = req.query;

    if (!cidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Cidade é obrigatória'
      });
    }

    let filtro = { 
      tipoPerfil: 'prestador', 
      ativo: true,
      'endereco.cidade': { $regex: cidade, $options: 'i' }
    };

    if (estado) {
      filtro['endereco.estado'] = { $regex: estado, $options: 'i' };
    }

    if (especialidade) {
      filtro.especialidades = { $in: [especialidade] };
    }

    if (precoMin || precoMax) {
      filtro.precoHora = {};
      if (precoMin) filtro.precoHora.$gte = parseFloat(precoMin);
      if (precoMax) filtro.precoHora.$lte = parseFloat(precoMax);
    }

    let prestadores = await User.find(filtro)
      .select('-senha -documentos.cpf -documentos.cnpj -dadosBancarios')
      .lean();

    // Ordenar
    if (ordenarPor === 'avaliacao') {
      prestadores.sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia);
    } else if (ordenarPor === 'preco') {
      prestadores.sort((a, b) => a.precoHora - b.precoHora);
    }

    res.json({
      sucesso: true,
      total: prestadores.length,
      cidade,
      prestadores
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar prestadores',
      erro: error.message
    });
  }
};

// OBTER ESPECIALIDADES DISPONÍVEIS
exports.obterEspecialidades = async (req, res) => {
  try {
    const especialidades = await User.distinct('especialidades', {
      tipoPerfil: 'prestador',
      ativo: true
    });

    res.json({
      sucesso: true,
      especialidades: especialidades.filter(e => e).sort()
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter especialidades',
      erro: error.message
    });
  }
};

// OBTER PRESTADOR DETALHADO (para visualizar perfil completo)
exports.obterPrestadorDetalhado = async (req, res) => {
  try {
    const { id } = req.params;

    const prestador = await User.findById(id)
      .select('-senha -documentos.cpf -documentos.cnpj -dadosBancarios');

    if (!prestador || prestador.tipoPerfil !== 'prestador') {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Prestador não encontrado'
      });
    }

    res.json({
      sucesso: true,
      prestador
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter prestador',
      erro: error.message
    });
  }
};

// ATUALIZAR GEOLOCALIZAÇÃO DO PRESTADOR
exports.atualizarGeolocalizacao = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Latitude e longitude são obrigatórias'
      });
    }

    const usuario = await User.findByIdAndUpdate(
      req.usuarioId,
      {
        'endereco.latitude': parseFloat(latitude),
        'endereco.longitude': parseFloat(longitude),
        ultimaAtualizacao: Date.now()
      },
      { new: true }
    ).select('-senha');

    res.json({
      sucesso: true,
      mensagem: 'Localização atualizada com sucesso',
      usuario
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar localização',
      erro: error.message
    });
  }
};