import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import ProHome      from './professional/Home';
import ProPatients  from './professional/Patients';
import ProObjectives from './professional/Objectives';
import ProLogs      from './professional/Logs';
import ProProfile   from './professional/Profile';

export default function ProfessionalApp() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a1510', display:'flex', flexDirection:'column' }}>
      <Nav dark={true} />
      <main style={{
        flex:1,
        maxWidth: 1100,
        width:'100%',
        margin:'0 auto',
        padding:'0 clamp(12px,3vw,28px) 84px',
      }}>
        <Routes>
          <Route index                 element={<ProHome />} />
          <Route path="pacientes"      element={<ProPatients />} />
          <Route path="objetivos"      element={<ProObjectives />} />
          <Route path="logs"           element={<ProLogs />} />
          <Route path="perfil"         element={<ProProfile />} />
          <Route path="*"              element={<Navigate to="/pro" replace />} />
        </Routes>
      </main>
    </div>
  );
}
