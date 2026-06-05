const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
  // Referências
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prestadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Informações do serviço
  titulo: { type: String, required: true },
  descricao: String,
  especialidade: String,
  
  // Data e hora
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, required: true },
  duracao: Number, // em minutos
  
  // Localização
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },
  
  // Preço
  precoHora: { type: Number, required: true },
  valorTotal: { type: Number, required: true },
  comissaoPlatforma: { type: Number, default: 0 }, // 12-18% do valor
  
  // Status do agendamento
  status: {
    type: String,
    enum: ['pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado'],
    default: 'pendente'
  },
  
  // Confirmação
  confirmadoEm: Date,
  prazoConfirmacao: Date, // 24h após agendamento
  
  // Cancelamento
  motivo_cancelamento: String,
  canceladoEm: Date,
  
  // Avaliação (após conclusão)
  avaliacao: {
    nota: { type: Number, min: 1, max: 5 },
    comentario: String,
    avaliadoEm: Date
  },
  
  // Histórico
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

// Índices para buscas rápidas
agendamentoSchema.index({ prestadorId: 1, dataInicio: 1 });
agendamentoSchema.index({ clienteId: 1, status: 1 });
agendamentoSchema.index({ status: 1, dataInicio: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);