const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Pegar token do header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        sucesso: false,
        mensagem: 'Token não fornecido' 
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    req.tipoPerfil = decoded.tipoPerfil;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        sucesso: false,
        mensagem: 'Token expirado' 
      });
    }

    res.status(401).json({ 
      sucesso: false,
      mensagem: 'Token inválido' 
    });
  }
};

// Middleware para admin
const ehAdmin = (req, res, next) => {
  if (req.tipoPerfil !== 'admin') {
    return res.status(403).json({ 
      sucesso: false,
      mensagem: 'Acesso restrito a administradores' 
    });
  }
  next();
};

// Middleware para prestador
const ehPrestador = (req, res, next) => {
  if (req.tipoPerfil !== 'prestador' && req.tipoPerfil !== 'admin') {
    return res.status(403).json({ 
      sucesso: false,
      mensagem: 'Acesso restrito a prestadores' 
    });
  }
  next();
};

module.exports = { auth, ehAdmin, ehPrestador };