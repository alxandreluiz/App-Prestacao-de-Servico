const User = require('../models/Users');
const jwt = require('jsonwebtoken');

// Gerar JWT
const gerarToken = (id, tipoPerfil) => {
  return jwt.sign(
    { id, tipoPerfil },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// REGISTRO
exports.registro = async (req, res) => {
  try {
    const { nome, email, senha, tipoPerfil, telefone } = req.body;
    
    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Nome, email e senha são obrigatórios' 
      });
    }
    
    // Verificar se usuário já existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Email já cadastrado' 
      });
    }
    
    // Criar novo usuário
    const usuario = new User({
      nome,
      email,
      senha,
      tipoPerfil: tipoPerfil || 'cliente',
      telefone
    });
    
    await usuario.save();
    
    // Gerar token
    const token = gerarToken(usuario._id, usuario.tipoPerfil);
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário criado com sucesso',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipoPerfil: usuario.tipoPerfil
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro ao criar usuário',
      erro: error.message 
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios' 
      });
    }
    
    const usuario = await User.findOne({ email }).select('+senha');
    
    if (!usuario) {
      return res.status(401).json({ 
        sucesso: false,
        mensagem: 'Email ou senha incorretos' 
      });
    }
    
    const senhaCorreta = await usuario.compararSenha(senha);
    
    if (!senhaCorreta) {
      return res.status(401).json({ 
        sucesso: false,
        mensagem: 'Email ou senha incorretos' 
      });
    }
    
    if (!usuario.ativo) {
      return res.status(403).json({ 
        sucesso: false,
        mensagem: 'Usuário inativo' 
      });
    }
    
    const token = gerarToken(usuario._id, usuario.tipoPerfil);
    
    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipoPerfil: usuario.tipoPerfil,
        fotoPerfil: usuario.fotoPerfil
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro ao fazer login',
      erro: error.message 
    });
  }
};

// GET USUÁRIO ATUAL
exports.obterUsuarioAtual = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipoPerfil: usuario.tipoPerfil,
        fotoPerfil: usuario.fotoPerfil,
        telefone: usuario.telefone,
        ativo: usuario.ativo
      }
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro ao obter usuário',
      erro: error.message 
    });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'Logout realizado com sucesso'
  });
};