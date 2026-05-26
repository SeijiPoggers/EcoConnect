import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orgsAPI, appointmentsAPI, patientsAPI } from '../../services/api';
import { Card, Button, Badge, SectionTitle, SearchBar, FilterChips, EmptyState, Modal, Input, Textarea, Alert } from '../../components/index';
import Spinner from '../../components/Spinner';

const TAGS = ['Todos','TEA','TDAH','Dislexia','Dyspraxia','Integração Sensorial','Ansiedade'];

export default function PatientOrgs() {
  const { user } = useAuth();
  const [orgs,    setOrgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tag,     setTag]     = useState('Todos');
  const [booking, setBooking] = useState(null); // org being booked
  const [patient, setPatient] = useState(null);

  // booking form
  const [bDate,  setBDate]  = useState('');
  const [bTime,  setBTime]  = useState('10:00');
  const [bNotes, setBNotes] = useState('');
  const [bLoad,  setBLoad]  = useState(false);
  const [bOk,    setBOk]    = useState(false);
  const [bErr,   setBErr]   = useState('');

  useEffect(() => {
    patientsAPI.me().then(setPatient).catch(() => {});
    loadOrgs();
  }, []);

  const loadOrgs = async (params = {}) => {
    setLoading(true);
    const data = await orgsAPI.list(params).catch(() => []);
    setOrgs(data);
    setLoading(false);
  };

  const handleFilter = (t) => {
    setTag(t);
    loadOrgs({ tag: t !== 'Todos' ? t : undefined, q: search || undefined });
  };

  const handleSearch = (q) => {
    setSearch(q);
    loadOrgs({ tag: tag !== 'Todos' ? tag : undefined, q: q || undefined });
  };

  const openBooking = (org) => {
    setBooking(org);
    setBOk(false); setBErr(''); setBDate(''); setBTime('10:00'); setBNotes('');
  };

  const confirmBook = async () => {
    if (!bDate) { setBErr('Selecione uma data.'); return; }
    setBLoad(true); setBErr('');
    try {
      await appointmentsAPI.create({
        organizationId: booking.id,
        professionalId: booking.professionals?.[0]?.id,
        date: bDate, time: bTime, notes: bNotes,
        patientId: patient?.id,
      });
      setBOk(true);
      loadOrgs();
    } catch (e) {
      setBErr(e?.error || 'Erro ao agendar.');
    }
    setBLoad(false);
  };

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle>🏢 Organizações Parceiras</SectionTitle>

      <SearchBar value={search} onChange={handleSearch} placeholder="Buscar por nome ou cidade..." />
      <FilterChips options={TAGS} active={tag} onChange={handleFilter} />
      <div style={{ height:14 }} />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner size={36} /></div>
      ) : orgs.length === 0 ? (
        <Card><EmptyState emoji="🔍" title="Nenhuma organização encontrada" sub="Tente outros termos de busca" /></Card>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
          {orgs.map(org => {
            const slots = org.slots ?? (org.slotsTotal - org.slotsUsed);
            return (
              <Card key={org.id}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,#68ddbd,#038554)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                    {org.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{org.name}</div>
                    <div style={{ fontSize:12, color:'#4a7060' }}>{org.type} · {org.city}</div>
                  </div>
                  <span style={{ fontSize:13, color:'#f59e0b', flexShrink:0 }}>⭐ {org.rating}</span>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {(org.tags || []).map(t => (
                    <span key={t.id||t} style={{ padding:'3px 10px', borderRadius:20, background:'#f4faf7', fontSize:11, color:'#4a7060' }}>
                      {t.tag || t}
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#4a7060' }}>🕐 Vagas: {slots}</span>
                  <Button size="sm" variant={slots > 0 ? 'primary' : 'outline'} onClick={() => slots > 0 && openBooking(org)}>
                    {slots > 0 ? 'Agendar' : 'Lista de espera'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Booking Modal ── */}
      {booking && (
        <Modal title={`Agendar — ${booking.name}`} onClose={() => setBooking(null)}>
          {bOk ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
              <h3 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:20, color:'#fff', marginBottom:8 }}>Consulta Agendada!</h3>
              <p style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>Você receberá uma confirmação em breve.</p>
              <Button variant="primary" size="sm" style={{ marginTop:20 }} onClick={() => setBooking(null)}>Fechar</Button>
            </div>
          ) : (
            <>
              <Input label="Data" value={bDate} onChange={setBDate} type="date" dark />
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(164,255,247,.6)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>Horário</label>
                <select value={bTime} onChange={e => setBTime(e.target.value)}
                  style={{ width:'100%', padding:'13px 15px', border:'1.5px solid rgba(3,187,133,.2)', borderRadius:10, fontSize:14, background:'rgba(255,255,255,.05)', color:'#fff', fontFamily:'inherit', outline:'none' }}>
                  {['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Textarea label="Observações (opcional)" value={bNotes} onChange={setBNotes} placeholder="Descreva suas necessidades ou dúvidas..." rows={3} dark />
              {bErr && <Alert type="error">{bErr}</Alert>}
              <Button variant="primary" full onClick={confirmBook} loading={bLoad}>Confirmar Agendamento</Button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
