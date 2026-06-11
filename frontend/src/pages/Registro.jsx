import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Registro() {
  const navigate = useNavigate();
  const { registro, carregando } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    senhaConfirm: '',
    tipoPerfil: 'cliente'
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro('');
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setErro('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErro('Email inválido');
      return false;
    }

    if (formData.senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (formData.senha !== formData.senhaConfirm) {
      setErro('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!validarFormulario()) {
      return;
    }

    try {
      await registro(
        formData.nome,
        formData.email,
        formData.senha,
        formData.tipoPerfil
      );

      setSucesso('Conta criada com sucesso! Redirecionando...');

      setTimeout(() => {
        if (formData.tipoPerfil === 'prestador') {
          navigate('/dashboard-prestador');
        } else {
          navigate('/dashboard-cliente');
        }
      }, 2000);
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao criar conta');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Criar Conta</h1>
        <p className="auth-subtitle">Junte-se à nossa plataforma</p>

        {erro && <div className="alert alert-erro">{erro}</div>}
        {sucesso && <div className="alert alert-sucesso">{sucesso}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome completo"
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipoPerfil">Tipo de Perfil</label>
            <select
              id="tipoPerfil"
              name="tipoPerfil"
              value={formData.tipoPerfil}
              onChange={handleChange}
              disabled={carregando}
            >
              <option value="cliente">Cliente</option>
              <option value="prestador">Prestador de Serviço</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senhaConfirm">Confirmar Senha</label>
            <input
              type="password"
              id="senhaConfirm"
              name="senhaConfirm"
              value={formData.senhaConfirm}
              onChange={handleChange}
              placeholder="Confirme sua senha"
              disabled={carregando}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={carregando}
          >
            {carregando ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Faça login aqui</Link>
        </p>
      </div>
    </div>
  );
}