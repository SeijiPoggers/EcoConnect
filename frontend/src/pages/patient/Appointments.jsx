// ── Appointments ──────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentsAPI, objectivesAPI, patientsAPI, contactAPI } from '../../services/api';
import { Card, Badge, Button, SectionTitle, FilterChips, EmptyState, XpBar, Alert } from '../../components/index';
import Spinner from '../../components/Spinner';

export function PatientAppointments() {
  const [apts,    setApts]    = useState([]);
  const [filter,  setFilter]  = useState('Todas');
  const [loading, setLoading] = useState(true);

  const load = () => appointmentsAPI.list().then(d => { setApts(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filterMap = { Todas:null, Agendadas:'SCHEDULED', Concluídas:'COMPLETED', Canceladas:'CANCELLED' };
  const shown = apts.filter(a => !filterMap[filter] || a.status === filterMap[filter]);

  const statusColor = { SCHEDULED:'green', COMPLETED:'blue', CANCELLED:'red', NO_SHOW:'orange' };
  const statusLabel = { SCHEDULED:'Agendado', COMPLETED:'Concluída', CANCELLED:'Cancelada', NO_SHOW:'Faltou' };

  const cancel = async (id) => {
    await appointmentsAPI.cancel(id).catch(() => {});
    load();
  };

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle>📅 Minhas Consultas</SectionTitle>
      <FilterChips options={['Todas','Agendadas','Concluídas','Canceladas']} active={filter} onChange={setFilter} />
      <div style={{ height:16 }} />
      {loading ? <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner size={36} /></div>
      : shown.length === 0 ? <Card><EmptyState emoji="📅" title="Nenhuma consulta" sub="Agende na aba Organizações" /></Card>
      : shown.map(a => (
        <Card key={a.id} style={{ marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:13, background:'linear-gradient(135deg,#038554,#03bb85)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {a.organization?.emoji || '🏥'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{a.organization?.name}</div>
              <div style={{ fontSize:12, color:'#4a7060' }}>{new Date(a.date).toLocaleDateString('pt-BR')} · {a.time}</div>
              {a.notes && <div style={{ fontSize:11, color:'#4a7060', marginTop:3, fontStyle:'italic' }}>"{a.notes}"</div>}
            </div>
            <Badge color={statusColor[a.status]}>{statusLabel[a.status]}</Badge>
          </div>
          {a.status === 'SCHEDULED' && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f4faf7' }}>
              <Button size="sm" variant="danger" onClick={() => cancel(a.id)}>Cancelar consulta</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
export default PatientAppointments;

// ── Contact ───────────────────────────────────────────────
export function PatientContact() {
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const [sent, setSent] = useState(false);
  const [load, setLoad] = useState(false);
  const [err,  setErr]  = useState('');
  const { user } = useAuth();

  const send = async () => {
    if (!form.name || !form.email || !form.message) { setErr('Preencha todos os campos.'); return; }
    setLoad(true); setErr('');
    try {
      await contactAPI.send(form);
      setSent(true);
    } catch { setErr('Erro ao enviar. Tente novamente.'); }
    setLoad(false);
  };

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle>💬 Fale Conosco</SectionTitle>

      {/* Contact cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        {[{e:'📧',t:'E-mail',s:'contato@ecoconnect.com.br'},{e:'📞',t:'Telefone',s:'(11) 3000-0000'},{e:'🕐',t:'Horário',s:'Seg–Sex · 8h–18h'}].map(c => (
          <Card key={c.t} style={{ textAlign:'center', padding:'18px 12px' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{c.e}</div>
            <div style={{ fontWeight:700, fontSize:14 }}>{c.t}</div>
            <div style={{ fontSize:12, color:'#4a7060', marginTop:4 }}>{c.s}</div>
          </Card>
        ))}
      </div>

      <SectionTitle>Enviar Mensagem</SectionTitle>
      <Card>
        {sent ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:44, marginBottom:14 }}>✅</div>
            <h3 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:20 }}>Mensagem enviada!</h3>
            <p style={{ color:'#4a7060', fontSize:13, marginTop:8 }}>Retornaremos em até 24 horas.</p>
            <Button variant="outline" size="sm" style={{ marginTop:18 }} onClick={() => { setSent(false); setForm({name:'',email:'',message:''}); }}>Nova mensagem</Button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:0 }}>
              <div style={{ marginBottom:14, marginRight:8 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4a7060', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>Nome</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Seu nome"
                  style={{ width:'100%', padding:'13px 15px', border:'1.5px solid #ddeee8', borderRadius:10, fontSize:14, background:'#f4faf7', outline:'none' }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4a7060', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>E-mail</label>
                <input value={form.email} onChange={e => setForm({...form,email:e.target.value})} type="email" placeholder="seu@email.com"
                  style={{ width:'100%', padding:'13px 15px', border:'1.5px solid #ddeee8', borderRadius:10, fontSize:14, background:'#f4faf7', outline:'none' }} />
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4a7060', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>Mensagem</label>
              <textarea value={form.message} onChange={e => setForm({...form,message:e.target.value})} rows={4} placeholder="Como podemos ajudar?"
                style={{ width:'100%', padding:'12px 15px', border:'1.5px solid #ddeee8', borderRadius:10, fontSize:14, background:'#f4faf7', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            </div>
            {err && <Alert type="error">{err}</Alert>}
            <Button variant="primary" full onClick={send} loading={load}>Enviar Mensagem</Button>
          </>
        )}
      </Card>

      {/* About section */}
      <div style={{ height:24 }} />
      <SectionTitle>ℹ️ Sobre o EcoConnect</SectionTitle>
      <Card>
        <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:19, fontWeight:700, color:'#038554', marginBottom:12 }}>🌿 Nossa Missão</div>
        <p style={{ fontSize:14, color:'#4a7060', lineHeight:1.7, marginBottom:14 }}>
          O EcoConnect conecta pessoas neurodivergentes — com TEA, TDAH, Dislexia e outras condições — com organizações especializadas em seu atendimento.
        </p>
        <p style={{ fontSize:14, color:'#4a7060', lineHeight:1.7 }}>
          Profissionais acompanham o progresso dos pacientes em tempo real, registram observações clínicas e estabelecem objetivos personalizados. O sistema de XP gamificado transforma cada conquista em motivação real.
        </p>
        <div style={{ marginTop:22, paddingTop:18, borderTop:'1px solid #ddeee8', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, textAlign:'center' }}>
          {[['500+','Pacientes'],['40+','Organizações'],['98%','Satisfação']].map(([n,l]) => (
            <div key={l}>
              <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:24, fontWeight:700, color:'#038554' }}>{n}</div>
              <div style={{ fontSize:11, color:'#4a7060' }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────
export function PatientProfile() {
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState(null);

  useEffect(() => { patientsAPI.me().then(setPatient).catch(() => {}); }, []);

  const menuItems = [
    { e:'📋', l:'Meus Dados Pessoais' },
    { e:'🔔', l:'Notificações'        },
    { e:'🔒', l:'Privacidade e Segurança' },
    { e:'ℹ️', l:'Sobre o EcoConnect'  },
  ];

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#005227,#038554)', borderRadius:22, padding:'28px 22px', textAlign:'center', marginBottom:20 }}>
        <div style={{ width:76, height:76, borderRadius:'50%', background:'linear-gradient(135deg,#68ddbd,#03bb85)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#005227', fontSize:28, margin:'0 auto 14px', border:'4px solid rgba(255,255,255,.22)' }}>
          {user?.avatar}
        </div>
        <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:22, color:'#fff', fontWeight:700 }}>{user?.name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:4 }}>
          {patient?.condition || 'Paciente'} · EcoConnect
        </div>
        {patient && (
          <div style={{ display:'flex', justifyContent:'center', gap:28, marginTop:18 }}>
            {[['⭐'+patient.xp,'XP Total'],['Nv.'+patient.level,'Nível'],['🌱','Membro']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:19, color:'#fff', fontWeight:700 }}>{n}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.45)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {patient && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4a7060', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Nível de Progresso</div>
          <XpBar xp={patient.xp} level={patient.level} />
        </Card>
      )}

      {menuItems.map(item => (
        <Card key={item.l} style={{ marginBottom:8, cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#f4faf7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{item.e}</div>
            <div style={{ flex:1, fontSize:14, fontWeight:500 }}>{item.l}</div>
            <span style={{ color:'#ddeee8', fontSize:18 }}>›</span>
          </div>
        </Card>
      ))}

      <Card style={{ marginTop:8, cursor:'pointer', borderColor:'rgba(220,60,60,.15)' }} onClick={logout}>
        <div style={{ display:'flex', alignItems:'center', gap:13 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'rgba(220,60,60,.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚪</div>
          <div style={{ flex:1, fontSize:14, fontWeight:500, color:'#c04040' }}>Sair da conta</div>
        </div>
      </Card>
    </div>
  );
}
