import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { professionalsAPI, patientsAPI } from '../../services/api';
import { Card, SectionTitle, Badge, Button, XpBar } from '../../components/index';
import Spinner from '../../components/Spinner';
import { Avatar } from '../../components/index';

export default function ProHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,    setStats]    = useState({ totalPatients:0, consultasHoje:0, objetivosConcluidos:0, taxaProgresso:0 });
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      professionalsAPI.stats().catch(() => ({})),
      patientsAPI.list().catch(() => []),
    ]).then(([s, p]) => {
      setStats(s);
      setPatients(p);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ paddingTop:60, display:'flex', justifyContent:'center' }}><Spinner size={36} color="#03bb85" /></div>;

  const statCards = [
    { n: stats.totalPatients,       l:'Pacientes Ativos'   },
    { n: stats.consultasHoje,       l:'Consultas Hoje'     },
    { n: `${stats.taxaProgresso}%`, l:'Taxa de Progresso'  },
    { n: stats.objetivosConcluidos, l:'Objetivos Concluídos' },
  ];

  return (
    <div className="fade-in">
      {/* ── Hero ── */}
      <div style={{
        background:'linear-gradient(135deg,#0a1510 0%,#005227 100%)',
        borderRadius:'0 0 24px 24px',
        padding:'28px 22px 32px',
        marginBottom:26,
        marginLeft:'calc(-1 * clamp(12px,3vw,28px))',
        marginRight:'calc(-1 * clamp(12px,3vw,28px))',
        position:'relative', overflow:'hidden',
      }}>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:4 }}>Portal Profissional</p>
        <h1 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:'clamp(20px,4vw,26px)', color:'#fff', fontWeight:700, marginBottom:4 }}>
          {user?.name} 👨‍⚕️
        </h1>
        <p style={{ fontSize:12, color:'#68ddbd', marginBottom:20 }}>
          {user?.professionalProfile?.crp} · {user?.professionalProfile?.specialty}
        </p>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {statCards.map(({ n, l }) => (
            <div key={l} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(3,187,133,.13)', borderRadius:13, padding:'12px 14px' }}>
              <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:28, color:'#68ddbd', fontWeight:700 }}>{n}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent patients ── */}
      <SectionTitle dark action={
        <Button variant="dark" size="sm" onClick={() => navigate('/pro/pacientes')}>Ver todos</Button>
      }>Pacientes Recentes</SectionTitle>

      <Card dark style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
        {patients.slice(0, 5).map((p, idx) => (
          <div
            key={p.id}
            onClick={() => navigate('/pro/objetivos')}
            style={{
              display:'flex', alignItems:'center', gap:13, padding:'13px 18px',
              borderBottom: idx < Math.min(patients.length-1, 4) ? '1px solid rgba(3,187,133,.06)' : 'none',
              cursor:'pointer', transition:'background .15s',
            }}
          >
            <Avatar initials={p.user?.avatar || '?'} size={40} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'rgba(255,255,255,.9)' }}>{p.user?.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.38)', marginTop:2 }}>{p.condition}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Badge color="dark">⭐ {p.xp} XP</Badge>
              <span style={{ color:'rgba(255,255,255,.2)', fontSize:16 }}>›</span>
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div style={{ padding:'32px 18px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:14 }}>
            Nenhum paciente cadastrado ainda
          </div>
        )}
      </Card>
    </div>
  );
}
