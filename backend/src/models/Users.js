const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  senha: {
    type: String,
    required: true,
    select: false
  },
  tipoPerfil: {
    type: String,
    enum: ['cliente', 'prestador', 'admin'],
    default: 'cliente'
  },
  telefone: String,
  ativo: {
    type: Boolean,
    default: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.compararSenha = async function(senhaFornecida) {
  return await bcrypt.compare(senhaFornecida, this.senha);
};

module.exports = mongoose.model('User', userSchema);