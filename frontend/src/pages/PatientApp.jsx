import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import PatientHome         from './patient/Home';
import PatientOrgs         from './patient/Orgs';
import PatientAppointments from './patient/Appointments';
import PatientContact      from './patient/Contact';
import PatientProfile      from './patient/Profile';

export default function PatientApp() {
  return (
    <div style={{ minHeight:'100vh', background:'#f4faf7', display:'flex', flexDirection:'column' }}>
      <Nav dark={false} />
      <main style={{
        flex:1,
        maxWidth: 940,
        width:'100%',
        margin:'0 auto',
        padding:'0 clamp(12px,3vw,24px) 84px',
      }}>
        <Routes>
          <Route index              element={<PatientHome />} />
          <Route path="orgs"        element={<PatientOrgs />} />
          <Route path="consultas"   element={<PatientAppointments />} />
          <Route path="contato"     element={<PatientContact />} />
          <Route path="perfil"      element={<PatientProfile />} />
          <Route path="*"           element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  );
}
