import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientsAPI, logsAPI } from '../../services/api';
import { Card, SectionTitle, Button, EmptyState, Modal, Textarea, Input, Alert, Toggle, Avatar } from '../../components/index';
import Spinner from '../../components/Spinner';

const LOG_TYPES = ['OBSERVATION','SESSION','PROGRESS','NOTE'];
const LOG_LABELS = { OBSERVATION:'Observação', SESSION:'Sessão', PROGRESS:'Progresso', NOTE:'Nota' };
const LOG_COLORS = { OBSERVATION:'#03bb85', SESSION:'#68ddbd', PROGRESS:'#a4fff7', NOTE:'rgba(255,255,255,.6)' };

function fmtDate(d) {
  const dt = new Date(d);
  const diff = Math.floor((new Date() - dt) / 86400000);
  if (diff === 0) return `Hoje, ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
  if (diff === 1) return 'Ontem';
  return dt.toLocaleDateString('pt-BR');
}

export default function ProLogs() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);

  // form
  const [fType,    setFType]    = useState('OBSERVATION');
  const [fTitle,   setFTitle]   = useState('');
  const [fContent, setFContent] = useState('');
  const [fVisible, setFVisible] = useState(false);
  const [addLoad,  setAddLoad]  = useState(false);
  const [addErr,   setAddErr]   = useState('');

  useEffect(() => {
    patientsAPI.list()
      .then(d => { setPatients(d); if (d.length > 0) setSelected(d[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadLogs = useCallback(() => {
    if (selected) logsAPI.list(selected.id).then(setLogs).catch(() => {});
  }, [selected]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const toggleVis = async (id) => {
    await logsAPI.toggleVisible(id).catch(() => {});
    loadLogs();
  };

  const addLog = async () => {
    if (!fTitle || !fContent) { setAddErr('Preencha título e conteúdo.'); return; }
    setAddLoad(true); setAddErr('');
    try {
      await logsAPI.create({ patientId: selected.id, type: fType, title: fTitle, content: fContent, isVisible: fVisible });
      setShowAdd(false); setFTitle(''); setFContent(''); setFType('OBSERVATION'); setFVisible(false);
      loadLogs();
    } catch (e) { setAddErr(e?.error || 'Erro ao salvar.'); }
    setAddLoad(false);
  };

  if (loading) return <div style={{ paddingTop:60, display:'flex', justifyContent:'center' }}><Spinner size={36} color="#03bb85" /></div>;

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle dark action={
        <Button variant="primary" size="sm" onClick={() => selected && setShowAdd(true)}>＋ Novo Log</Button>
      }>📝 Logs Clínicos</SectionTitle>

      {/* Patient selector */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:18, paddingBottom:4 }}>
        {patients.map(p => (
          <button key={p.id} onClick={() => setSelected(p)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:20, cursor:'pointer', flexShrink:0, border:'none',
              background: selected?.id===p.id?'rgba(3,187,133,.18)':'rgba(255,255,255,.05)',
              outline: selected?.id===p.id?'1.5px solid #03bb85':'1.5px solid rgba(3,187,133,.14)', transition:'all .15s' }}>
            <Avatar initials={p.user?.avatar||'?'} size={24} />
            <span style={{ fontSize:12, fontWeight:600, color:selected?.id===p.id?'#68ddbd':'rgba(255,255,255,.5)', whiteSpace:'nowrap' }}>
              {p.user?.name?.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {!selected ? (
        <Card dark><EmptyState emoji="👆" title="Selecione um paciente" sub="Escolha acima para ver os logs" dark /></Card>
      ) : logs.length === 0 ? (
        <Card dark><EmptyState emoji="📝" title="Nenhum log registrado" sub="Adicione o primeiro registro clínico" dark /></Card>
      ) : logs.map(l => (
        <div key={l.id} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(3,187,133,.1)', borderRadius:13, padding:'14px 16px', marginBottom:11 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
            <span style={{ background:'rgba(3,187,133,.1)', color:LOG_COLORS[l.type]||'#03bb85', padding:'3px 11px', borderRadius:20, fontSize:11, fontWeight:700 }}>
              {LOG_LABELS[l.type] || l.type}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{fmtDate(l.createdAt)}</span>
              <Toggle value={l.isVisible} onChange={() => toggleVis(l.id)} />
            </div>
          </div>
          <div style={{ fontWeight:600, fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:7 }}>{l.title}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.52)', lineHeight:1.65 }}>{l.content}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.22)', marginTop:9 }}>
            {l.isVisible ? '👁️ Visível para o paciente' : '🔒 Privado — apenas profissionais'}
          </div>
        </div>
      ))}

      {/* ── Add Log Modal ── */}
      {showAdd && (
        <Modal title={`Novo Registro — ${selected?.user?.name?.split(' ')[0]}`} onClose={() => setShowAdd(false)}>
          {/* Type selector */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:18 }}>
            {LOG_TYPES.map(t => (
              <button key={t} onClick={() => setFType(t)} style={{
                padding:'9px 4px', borderRadius:9, textAlign:'center', fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
                background: fType===t ? 'rgba(3,187,133,.18)' : 'rgba(255,255,255,.04)',
                outline: fType===t ? '1.5px solid #03bb85' : '1.5px solid rgba(3,187,133,.14)',
                color: fType===t ? '#68ddbd' : 'rgba(255,255,255,.4)',
                transition:'all .15s',
              }}>{LOG_LABELS[t]}</button>
            ))}
          </div>

          <Input label="Título do registro" value={fTitle} onChange={setFTitle} placeholder="Resumo em uma linha..." dark />
          <Textarea label="Conteúdo" value={fContent} onChange={setFContent} placeholder="Detalhes da sessão ou observação clínica..." rows={5} dark />

          {/* Visibility toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,.04)', border:'1px solid rgba(3,187,133,.12)', borderRadius:10, padding:'13px 16px', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.8)', fontWeight:500 }}>Visível para o paciente</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>O paciente poderá ler este registro</div>
            </div>
            <Toggle value={fVisible} onChange={setFVisible} />
          </div>

          {addErr && <Alert type="error">{addErr}</Alert>}
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="dark" full onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button variant="primary" full onClick={addLog} loading={addLoad}>Salvar Registro</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
