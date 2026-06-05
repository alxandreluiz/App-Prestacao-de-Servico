const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Dados básicos
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true, select: false },
  tipoPerfil: { type: String, enum: ['cliente', 'prestador', 'admin'], default: 'cliente' },
  telefone: String,
  ativo: { type: Boolean, default: true },
  
  // Foto de perfil
  fotoPerfil: String,
  
  // Dados de Cliente
  cpf: String,
  dataNascimento: Date,
  
  // Dados de Prestador
  descricao: String,
  especialidades: [String], // Ex: ['Encanamento', 'Hidráulica']
  precoHora: Number,
  avaliacaoMedia: { type: Number, default: 0, min: 0, max: 5 },
  totalAvaliacoes: { type: Number, default: 0 },
  
  // Localização (CRÍTICO para busca inteligente)
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
    latitude: Number,
    longitude: Number
  },
  
  // Documentos de prestador
  documentos: {
    cpf: String,
    cnpj: String,
    rg: String,
    verificado: { type: Boolean, default: false }
  },
  
  // Dados bancários (para pagamento)
  dadosBancarios: {
    banco: String,
    agencia: String,
    conta: String,
    titular: String
  },
  
  // Portfolio (fotos de trabalhos)
  portfolio: [
    {
      url: String,
      descricao: String,
      dataCriacao: { type: Date, default: Date.now }
    }
  ],
  
  // Histórico
  dataRegistro: { type: Date, default: Date.now },
  ultimaAtualizacao: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  if (!this.isModified('senha')) {
    return next();
  }
  bcrypt.hash(this.senha, 10, (err, hash) => {
    if (err) return next(err);
    this.senha = hash;
    next();
  });
});

userSchema.methods.compararSenha = function(senhaFornecida, callback) {
  bcrypt.compare(senhaFornecida, this.senha, callback);
};

module.exports = mongoose.model('User', userSchema);