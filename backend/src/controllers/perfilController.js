const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// OBTER PERFIL DO USUÁRIO
exports.obterPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId).select('-senha');
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      usuario
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter perfil',
      erro: error.message
    });
  }
};

// ATUALIZAR PERFIL CLIENTE
exports.atualizarPerfilCliente = async (req, res) => {
  try {
    const { nome, telefone, cpf, dataNascimento, endereco } = req.body;
    
    const usuario = await User.findByIdAndUpdate(
      req.usuarioId,
      {
        nome,
        telefone,
        cpf,
        dataNascimento,
        endereco,
        ultimaAtualizacao: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-senha');
    
    res.json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso',
      usuario
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar perfil',
      erro: error.message
    });
  }
};

// ATUALIZAR PERFIL PRESTADOR
exports.atualizarPerfilPrestador = async (req, res) => {
  try {
    const { 
      nome, 
      telefone, 
      descricao, 
      especialidades, 
      precoHora,
      endereco,
      documentos,
      dadosBancarios
    } = req.body;
    
    const usuario = await User.findByIdAndUpdate(
      req.usuarioId,
      {
        nome,
        telefone,
        descricao,
        especialidades,
        precoHora,
        endereco,
        documentos,
        dadosBancarios,
        ultimaAtualizacao: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-senha');
    
    res.json({
      sucesso: true,
      mensagem: 'Perfil de prestador atualizado com sucesso',
      usuario
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar perfil',
      erro: error.message
    });
  }
};

// UPLOAD DE FOTO DE PERFIL
exports.uploadFotoPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nenhuma foto foi enviada'
      });
    }
    
    const usuario = await User.findByIdAndUpdate(
      req.usuarioId,
      { 
        fotoPerfil: `/uploads/${req.file.filename}`,
        ultimaAtualizacao: Date.now()
      },
      { new: true }
    ).select('-senha');
    
    res.json({
      sucesso: true,
      mensagem: 'Foto de perfil atualizada com sucesso',
      usuario
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao fazer upload da foto',
      erro: error.message
    });
  }
};

// LISTAR PRESTADORES (para busca inteligente)
exports.listarPrestadores = async (req, res) => {
  try {
    const { cidade, especialidade, precoMax } = req.query;
    
    let filtro = { tipoPerfil: 'prestador', ativo: true };
    
    if (cidade) {
      filtro['endereco.cidade'] = { $regex: cidade, $options: 'i' };
    }
    
    if (especialidade) {
      filtro.especialidades = { $in: [especialidade] };
    }
    
    if (precoMax) {
      filtro.precoHora = { $lte: parseInt(precoMax) };
    }
    
    const prestadores = await User.find(filtro)
      .select('-senha -documentos.cpf -documentos.cnpj -dadosBancarios')
      .sort({ avaliacaoMedia: -1 });
    
    res.json({
      sucesso: true,
      total: prestadores.length,
      prestadores
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar prestadores',
      erro: error.message
    });
  }
};

// OBTER PRESTADOR POR ID
exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await User.findById(req.params.id)
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