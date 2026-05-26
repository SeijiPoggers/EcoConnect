import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientsAPI, objectivesAPI, appointmentsAPI } from '../../services/api';
import { Card, SectionTitle, Badge, Button, XpBar, EmptyState } from '../../components/index';
import Spinner from '../../components/Spinner';

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient,  setPatient]  = useState(null);
  const [objs,     setObjs]     = useState([]);
  const [apts,     setApts]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      patientsAPI.me().catch(() => null),
      objectivesAPI.list().catch(() => []),
      appointmentsAPI.list().catch(() => []),
    ]).then(([p, o, a]) => {
      setPatient(p);
      setObjs(o);
      setApts(a);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ paddingTop:60, display:'flex', justifyContent:'center' }}>
      <Spinner size={36} />
    </div>
  );

  const upcoming = apts.filter(a => a.status === 'SCHEDULED').slice(0, 2);
  const done     = objs.filter(o => o.done).length;

  return (
    <div className="fade-in">
      {/* ── Hero banner ── */}
      <div style={{
        background:'linear-gradient(135deg,#005227 0%,#038554 100%)',
        borderRadius:'0 0 24px 24px',
        padding:'28px 22px 32px',
        marginBottom:26,
        marginLeft: 'calc(-1 * clamp(12px,3vw,24px))',
        marginRight:'calc(-1 * clamp(12px,3vw,24px))',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(164,255,247,.08)' }} />
        <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginBottom:4 }}>Olá,</p>
        <h1 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:clamp(22,26), color:'#fff', fontWeight:700, marginBottom:4 }}>
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize:12, color:'#68ddbd', marginBottom: patient ? 20 : 0 }}>
          Sua jornada de bem-estar continua
        </p>
        {patient && (
          <div style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'14px 16px' }}>
            <XpBar xp={patient.xp} level={patient.level} dark />
          </div>
        )}
      </div>

      {/* ── Two-column grid on desktop ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>

        {/* Próximas consultas */}
        <div>
          <SectionTitle action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/consultas')}>Ver todas</Button>
          }>📅 Próximas Consultas</SectionTitle>

          {upcoming.length === 0 ? (
            <Card>
              <EmptyState emoji="📅" title="Nenhuma consulta" sub="Agende nas organizações parceiras" />
              <Button variant="outline" full size="sm" style={{ marginTop:12 }} onClick={() => navigate('/app/orgs')}>
                Buscar organizações
              </Button>
            </Card>
          ) : upcoming.map(a => (
            <Card key={a.id} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#038554,#03bb85)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {a.organization?.emoji || '🏥'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.organization?.name}</div>
                  <div style={{ fontSize:12, color:'#4a7060' }}>{new Date(a.date).toLocaleDateString('pt-BR')} · {a.time}</div>
                </div>
                <Badge color="green">Agendado</Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Objetivos */}
        <div>
          <SectionTitle>🎯 Seus Objetivos ({done}/{objs.length})</SectionTitle>
          <Card>
            {objs.length === 0 ? (
              <EmptyState emoji="🎯" title="Nenhum objetivo" sub="Seu profissional irá criar objetivos em breve" />
            ) : objs.slice(0, 5).map(o => (
              <div key={o.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid #f4faf7' }}>
                <div style={{
                  width:18, height:18, borderRadius:'50%', flexShrink:0, marginTop:2,
                  background: o.done ? '#03bb85' : 'transparent',
                  border:`2px solid ${o.done ? '#03bb85' : '#ddeee8'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {o.done && <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color: o.done ? '#4a7060' : '#0d1f18', textDecoration: o.done ? 'line-through' : 'none' }}>
                    {o.text}
                  </div>
                  {o.done && (
                    <div style={{ fontSize:11, color:'#038554', marginTop:2 }}>✅ +{o.xpReward} XP</div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

      </div>
    </div>
  );
}

// tiny helper so we don't need a dependency
function clamp(min, max) { return `clamp(${min}px,5vw,${max}px)`; }
