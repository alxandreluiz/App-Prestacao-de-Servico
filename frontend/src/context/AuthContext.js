import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario = null, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const api = useMemo(() => axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }), [token]);

  const verificarAutenticacao = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUsuario(response.data.usuario);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    if (token) {
      verificarAutenticacao();
    } else {
      setCarregando(false);
    }
  }, [token, verificarAutenticacao]);


  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token: novoToken, usuario } = response.data;
      
      localStorage.setItem('token', novoToken);
      setToken(novoToken);
      setUsuario(usuario);
      
      return { sucesso: true, usuario };
    } catch (error) {
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.mensagem || 'Erro ao fazer login'
      };
    }
  };

  const registro = async (nome, email, senha, tipoPerfil) => {
    try {
      const response = await api.post('/auth/registro', { 
        nome, 
        email, 
        senha, 
        tipoPerfil 
      });
      const { token: novoToken, usuario } = response.data;
      
      localStorage.setItem('token', novoToken);
      setToken(novoToken);
      setUsuario(usuario);
      
      return { sucesso: true, usuario };
    } catch (error) {
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.mensagem || 'Erro ao registrar'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  };

  const obterPerfil = async () => {
    try {
      const response = await api.get('/perfil/me');
      return response.data.usuario;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return null;
    }
  };

  const atualizarPerfilCliente = async (dados) => {
    try {
      const response = await api.put('/perfil/cliente', dados);
      setUsuario(response.data.usuario);
      return { sucesso: true, usuario: response.data.usuario };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error.response?.data?.mensagem || 'Erro ao atualizar perfil'
      };
    }
  };

  const atualizarPerfilPrestador = async (dados) => {
    try {
      const response = await api.put('/perfil/prestador', dados);
      setUsuario(response.data.usuario);
      return { sucesso: true, usuario: response.data.usuario };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error.response?.data?.mensagem || 'Erro ao atualizar perfil'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      carregando,
      login,
      registro,
      logout,
      obterPerfil,
      atualizarPerfilCliente,
      atualizarPerfilPrestador
    }}>
      {children}
    </AuthContext.Provider>
  );
};
