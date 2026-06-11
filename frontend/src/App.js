import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registro from './pages/Registro';
import './App.css';

// Componente para proteger rotas
const RotaProtegida = ({ children }) => {
  const { estaAutenticado, carregando } = useAuth();

  if (carregando) {
    return <div className="carregando">Carregando...</div>;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para página inicial
const Home = () => {
  const { usuario, logout } = useAuth();

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1>🏠 App de Serviços</h1>
          <div className="nav-right">
            <span>Bem-vindo, {usuario?.nome}!</span>
            <button onClick={logout} className="btn btn-secondary">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="home-content">
        <h2>Dashboard</h2>
        <p>Tipo de Perfil: <strong>{usuario?.tipoPerfil}</strong></p>
        <p>Email: <strong>{usuario?.email}</strong></p>
        
        {usuario?.tipoPerfil === 'cliente' && (
          <div className="dashboard-cliente">
            <h3>Bem-vindo, Cliente!</h3>
            <p>Em breve: Buscar serviços, fazer agendamentos e avaliar prestadores</p>
          </div>
        )}

        {usuario?.tipoPerfil === 'prestador' && (
          <div className="dashboard-prestador">
            <h3>Bem-vindo, Prestador!</h3>
            <p>Em breve: Gerenciar sua agenda, visualizar solicitações e receber avaliações</p>
          </div>
        )}

        {usuario?.tipoPerfil === 'admin' && (
          <div className="dashboard-admin">
            <h3>Painel Administrativo</h3>
            <p>Em breve: Gerenciar usuários, visualizar estatísticas e configurações</p>
          </div>
        )}
      </div>
    </div>
  );
};

function AppContent() {
  const { carregando } = useAuth();

  if (carregando) {
    return <div className="carregando">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar-senha" element={<div>Página em desenvolvimento</div>} />
      
      <Route
        path="/"
        element={
          <RotaProtegida>
            <Home />
          </RotaProtegida>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;