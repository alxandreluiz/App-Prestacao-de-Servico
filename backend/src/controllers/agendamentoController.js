const Agendamento = require('../models/Agendamento');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configurar email
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço de email
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// FUNÇÃO AUXILIAR: Enviar email
const enviarEmail = async (to, assunto, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: assunto,
      html
    });
    console.log(`✅ Email enviado para ${to}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar email: ${error.message}`);
  }
};

// CRIAR AGENDAMENTO
exports.criarAgendamento = async (req, res) => {
  try {
    const { 
      prestadorId, 
      titulo, 
      descricao, 
      especialidade,
      dataInicio, 
      dataFim,
      endereco 
    } = req.body;

    const clienteId = req.usuarioId;

    // Validações
    if (!prestadorId || !dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados incompletos'
      });
    }

    // Verificar se prestador existe
    const prestador = await User.findById(prestadorId);
    if (!prestador || prestador.tipoPerfil !== 'prestador') {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Prestador não encontrado'
      });
    }

    // Verificar disponibilidade
    const conflito = await Agendamento.findOne({
      prestadorId,
      status: { $in: ['confirmado', 'em_andamento'] },
      $or: [
        { dataInicio: { $lt: new Date(dataFim) }, dataFim: { $gt: new Date(dataInicio) } }
      ]
    });

    if (conflito) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Prestador indisponível neste horário'
      });
    }

    // Calcular duração e valor
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const duracao = (fim - inicio) / (1000 * 60); // em minutos
    const horas = duracao / 60;
    const valorTotal = horas * prestador.precoHora;
    const comissaoPlatforma = valorTotal * 0.15; // 15% de comissão

    // Criar agendamento
    const agendamento = new Agendamento({
      clienteId,
      prestadorId,
      titulo,
      descricao,
      especialidade,
      dataInicio: inicio,
      dataFim: fim,
      duracao,
      endereco: endereco || {},
      precoHora: prestador.precoHora,
      valorTotal: Math.round(valorTotal * 100) / 100,
      comissaoPlatforma: Math.round(comissaoPlatforma * 100) / 100,
      prazoConfirmacao: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h depois
    });

    await agendamento.save();

    // Buscar cliente para enviar email
    const cliente = await User.findById(clienteId);

    // Enviar emails
    const dataFormatada = inicio.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Email para prestador
    await enviarEmail(
      prestador.email,
      '📅 Novo Agendamento Recebido',
      `
      <h2>Novo Serviço Agendado</h2>
      <p><strong>Cliente:</strong> ${cliente.nome}</p>
      <p><strong>Serviço:</strong> ${titulo}</p>
      <p><strong>Data/Hora:</strong> ${dataFormatada}</p>
      <p><strong>Duração:</strong> ${Math.round(duracao)} minutos</p>
      <p><strong>Valor:</strong> R$ ${valorTotal.toFixed(2)}</p>
      <p><strong>⏰ Você tem até 24h para confirmar este agendamento</strong></p>
      <a href="${process.env.APP_URL}/agendamentos/${agendamento._id}">Ver Detalhes</a>
      `
    );

    // Email para cliente
    await enviarEmail(
      cliente.email,
      '✅ Agendamento Solicitado com Sucesso',
      `
      <h2>Sua Solicitação foi Registrada</h2>
      <p><strong>Prestador:</strong> ${prestador.nome}</p>
      <p><strong>Serviço:</strong> ${titulo}</p>
      <p><strong>Data/Hora:</strong> ${dataFormatada}</p>
      <p><strong>Valor:</strong> R$ ${valorTotal.toFixed(2)}</p>
      <p>O prestador tem até 24h para confirmar seu agendamento.</p>
      `
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Agendamento criado com sucesso',
      agendamento: await Agendamento.findById(agendamento._id)
        .populate('clienteId', 'nome email telefone fotoPerfil')
        .populate('prestadorId', 'nome email telefone fotoPerfil especialidades')
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar agendamento',
      erro: error.message
    });
  }
};

// CONFIRMAR AGENDAMENTO
exports.confirmarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const prestadorId = req.usuarioId;

    const agendamento = await Agendamento.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Agendamento não encontrado'
      });
    }

    // Verificar se é prestador do agendamento
    if (agendamento.prestadorId.toString() !== prestadorId) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para confirmar este agendamento'
      });
    }

    if (agendamento.status !== 'pendente') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Apenas agendamentos pendentes podem ser confirmados'
      });
    }

    agendamento.status = 'confirmado';
    agendamento.confirmadoEm = Date.now();
    await agendamento.save();

    // Enviar email de confirmação
    const cliente = await User.findById(agendamento.clienteId);
    const prestador = await User.findById(agendamento.prestadorId);

    const dataFormatada = agendamento.dataInicio.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await enviarEmail(
      cliente.email,
      '✅ Agendamento Confirmado!',
      `
      <h2>Seu Agendamento foi Confirmado!</h2>
      <p><strong>Prestador:</strong> ${prestador.nome}</p>
      <p><strong>Telefone:</strong> ${prestador.telefone}</p>
      <p><strong>Data/Hora:</strong> ${dataFormatada}</p>
      <p><strong>Valor:</strong> R$ ${agendamento.valorTotal.toFixed(2)}</p>
      <p>Prepare-se para o atendimento. Até logo!</p>
      `
    );

    res.json({
      sucesso: true,
      mensagem: 'Agendamento confirmado com sucesso',
      agendamento
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao confirmar agendamento',
      erro: error.message
    });
  }
};

// CANCELAR AGENDAMENTO
exports.cancelarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioId = req.usuarioId;

    const agendamento = await Agendamento.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Agendamento não encontrado'
      });
    }

    // Verificar permissão (cliente ou prestador)
    const ehClienteOuPrestador = 
      agendamento.clienteId.toString() === usuarioId ||
      agendamento.prestadorId.toString() === usuarioId;

    if (!ehClienteOuPrestador) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para cancelar este agendamento'
      });
    }

    if (['concluido', 'cancelado'].includes(agendamento.status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este agendamento não pode ser cancelado'
      });
    }

    agendamento.status = 'cancelado';
    agendamento.motivo_cancelamento = motivo || 'Cancelado pelo usuário';
    agendamento.canceladoEm = Date.now();
    await agendamento.save();

    // Enviar emails de cancelamento
    const cliente = await User.findById(agendamento.clienteId);
    const prestador = await User.findById(agendamento.prestadorId);

    await enviarEmail(
      prestador.email,
      '❌ Agendamento Cancelado',
      `<p>O agendamento de ${cliente.nome} foi cancelado.</p>`
    );

    await enviarEmail(
      cliente.email,
      '❌ Agendamento Cancelado',
      `<p>Seu agendamento foi cancelado com sucesso.</p>`
    );

    res.json({
      sucesso: true,
      mensagem: 'Agendamento cancelado com sucesso',
      agendamento
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao cancelar agendamento',
      erro: error.message
    });
  }
};

// LISTAR AGENDAMENTOS DO PRESTADOR
exports.listarAgendamentosPrestador = async (req, res) => {
  try {
    const prestadorId = req.usuarioId;
    const { status, mes, ano } = req.query;

    let filtro = { prestadorId };

    if (status) {
      filtro.status = status;
    }

    if (mes && ano) {
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0, 23, 59, 59);
      filtro.dataInicio = { $gte: dataInicio, $lte: dataFim };
    }

    const agendamentos = await Agendamento.find(filtro)
      .populate('clienteId', 'nome email telefone fotoPerfil')
      .sort({ dataInicio: 1 });

    res.json({
      sucesso: true,
      total: agendamentos.length,
      agendamentos
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar agendamentos',
      erro: error.message
    });
  }
};

// LISTAR AGENDAMENTOS DO CLIENTE
exports.listarAgendamentosCliente = async (req, res) => {
  try {
    const clienteId = req.usuarioId;
    const { status } = req.query;

    let filtro = { clienteId };
    if (status) {
      filtro.status = status;
    }

    const agendamentos = await Agendamento.find(filtro)
      .populate('prestadorId', 'nome email telefone fotoPerfil especialidades')
      .sort({ dataInicio: 1 });

    res.json({
      sucesso: true,
      total: agendamentos.length,
      agendamentos
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar agendamentos',
      erro: error.message
    });
  }
};
