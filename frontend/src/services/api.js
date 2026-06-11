import axios from 'axios';

// Criar instância da API
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar token ao header de cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funções de Autenticação
export const authService = {
  registro: (dados) => api.post('/auth/registro', dados),
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  obterUsuarioAtual: () => api.get('/auth/me')
};

export default api;