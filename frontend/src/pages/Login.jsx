import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, carregando } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!formData.email || !formData.senha) {
      setErro('Email e senha são obrigatórios');
      return;
    }

    try {
      const response = await login(formData.email, formData.senha);

      // Redirecionar baseado no tipo de perfil
      if (response.usuario.tipoPerfil === 'prestador') {
        navigate('/dashboard-prestador');
      } else if (response.usuario.tipoPerfil === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard-cliente');
      }
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao fazer login');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Fazer Login</h1>
        <p className="auth-subtitle">Bem-vindo de volta!</p>

        {erro && <div className="alert alert-erro">{erro}</div>}

        <form onSubmit={handleSubmit}>
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
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Sua senha"
              disabled={carregando}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Fazer Login'}
          </button>
        </form>

        <div className="auth-links">
          <p className="auth-footer">
            Não tem conta? <Link to="/registro">Registre-se aqui</Link>
          </p>
          <p className="auth-footer">
            <Link to="/recuperar-senha">Esqueceu a senha?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}