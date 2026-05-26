import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage      from './pages/LoginPage';
import PatientApp     from './pages/PatientApp';
import ProfessionalApp from './pages/ProfessionalApp';
import Spinner        from './components/Spinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a1510' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
        <Spinner size={32} color="#03bb85" />
      </div>
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*"      element={<Navigate to="/login" replace />} />
    </Routes>
  );

  if (user.role === 'PROFESSIONAL') return (
    <Routes>
      <Route path="/pro/*"  element={<ProfessionalApp />} />
      <Route path="*"       element={<Navigate to="/pro" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/app/*" element={<PatientApp />} />
      <Route path="*"      element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
