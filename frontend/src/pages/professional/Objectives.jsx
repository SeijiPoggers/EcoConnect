import { useState, useEffect, useCallback } from 'react';
import { patientsAPI, objectivesAPI } from '../../services/api';
import { Card, SectionTitle, Button, EmptyState, Modal, Input, Alert, XpBar, Avatar } from '../../components/index';
import Spinner from '../../components/Spinner';

export default function ProObjectives() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [objs,     setObjs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);

  // new objective form
  const [nText,    setNText]    = useState('');
  const [nXp,      setNXp]      = useState('15');
  const [nDeadline,setNDeadline]= useState('');
  const [nVisible, setNVisible] = useState(true);
  const [addLoad,  setAddLoad]  = useState(false);
  const [addErr,   setAddErr]   = useState('');

  useEffect(() => {
    patientsAPI.list()
      .then(d => { setPatients(d); if (d.length > 0) setSelected(d[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadObjs = useCallback(() => {
    if (!selected) return;
    objectivesAPI.list(selected.id).then(setObjs).catch(() => {});
  }, [selected]);

  useEffect(() => { loadObjs(); }, [loadObjs]);

  const toggleObj = async (obj) => {
    await objectivesAPI.toggle(obj.id).catch(() => {});
    // Refresh patient XP
    const fresh = await patientsAPI.list().catch(() => patients);
    setPatients(fresh);
    const updatedSel = fresh.find(p => p.id === selected?.id);
    if (updatedSel) setSelected(updatedSel);
    loadObjs();
  };

  const deleteObj = async (id) => {
    await objectivesAPI.delete(id).catch(() => {});
    loadObjs();
  };

  const addObj = async () => {
    if (!nText.trim()) { setAddErr('Descreva o objetivo.'); return; }
    setAddLoad(true); setAddErr('');
    try {
      await objectivesAPI.create({
        patientId: selected.id, text: nText,
        xpReward: parseInt(nXp) || 15,
        deadline: nDeadline || undefined,
        isVisible: nVisible,
      });
      setShowAdd(false); setNText(''); setNXp('15'); setNDeadline('');
      loadObjs();
    } catch (e) { setAddErr(e?.error || 'Erro ao salvar.'); }
    setAddLoad(false);
  };

  const done  = objs.filter(o => o.done).length;

  if (loading) return <div style={{ paddingTop:60, display:'flex', justifyContent:'center' }}><Spinner size={36} color="#03bb85" /></div>;

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle dark action={
        <Button variant="primary" size="sm" onClick={() => selected && setShowAdd(true)}>＋ Novo Objetivo</Button>
      }>✅ Objetivos dos Pacientes</SectionTitle>

      {/* Patient chips */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:18, paddingBottom:4 }}>
        {patients.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
              borderRadius:20, cursor:'pointer', flexShrink:0, border:'none',
              background: selected?.id===p.id ? 'rgba(3,187,133,.18)' : 'rgba(255,255,255,.05)',
              outline: selected?.id===p.id ? `1.5px solid #03bb85` : '1.5px solid rgba(3,187,133,.14)',
              transition:'all .15s',
            }}
          >
            <Avatar initials={p.user?.avatar||'?'} size={24} />
            <span style={{ fontSize:12, fontWeight:600, color: selected?.id===p.id?'#68ddbd':'rgba(255,255,255,.5)', whiteSpace:'nowrap' }}>
              {p.user?.name?.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {!selected ? (
        <Card dark><EmptyState emoji="👆" title="Selecione um paciente" sub="Escolha um paciente acima" dark /></Card>
      ) : (
        <>
          {/* Progress overview */}
          <Card dark style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,.6)' }}>Progresso de {selected.user?.name?.split(' ')[0]}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#68ddbd' }}>{done}/{objs.length} concluídos</span>
            </div>
            <XpBar xp={selected.xp} level={selected.level} dark />
            <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:8 }}>
              ⭐ XP é atualizado automaticamente ao marcar objetivos como concluídos
            </p>
          </Card>

          {/* Objectives list */}
          {objs.length === 0 ? (
            <Card dark><EmptyState emoji="🎯" title="Nenhum objetivo" sub="Crie o primeiro objetivo para este paciente" dark /></Card>
          ) : objs.map(o => (
            <div key={o.id} style={{
              background:'rgba(255,255,255,.04)', border:'1px solid rgba(3,187,133,.1)',
              borderRadius:13, padding:'14px 16px', marginBottom:10,
              display:'flex', alignItems:'flex-start', gap:12,
              opacity: o.done ? .72 : 1, transition:'opacity .2s',
            }}>
              {/* Checkbox */}
              <div
                onClick={() => toggleObj(o)}
                style={{
                  width:23, height:23, borderRadius:'50%', flexShrink:0, marginTop:1,
                  background: o.done ? '#03bb85' : 'transparent',
                  border:`2px solid ${o.done ? '#03bb85' : 'rgba(3,187,133,.38)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', transition:'all .2s',
                }}
              >
                {o.done && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color: o.done?'rgba(255,255,255,.4)':'rgba(255,255,255,.85)', fontWeight:500, textDecoration: o.done?'line-through':'none' }}>
                  {o.text}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:4 }}>
                  +{o.xpReward} XP
                  {o.deadline && ` · Prazo: ${new Date(o.deadline).toLocaleDateString('pt-BR')}`}
                  {o.done && <span style={{ color:'#03bb85' }}> · ✅ Concluído — XP enviado ao paciente</span>}
                </div>
              </div>
              <Button variant="danger" size="sm" style={{ padding:'4px 10px', fontSize:11 }} onClick={() => deleteObj(o.id)}>✕</Button>
            </div>
          ))}

          {/* Add inline CTA */}
          <button
            onClick={() => setShowAdd(true)}
            style={{ width:'100%', padding:'13px', border:'2px dashed rgba(3,187,133,.22)', borderRadius:13, background:'transparent', color:'rgba(3,187,133,.65)', fontSize:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}
          >
            ＋ Adicionar novo objetivo
          </button>
        </>
      )}

      {/* ── Add Objective Modal ── */}
      {showAdd && selected && (
        <Modal title={`Novo Objetivo — ${selected.user?.name?.split(' ')[0]}`} onClose={() => setShowAdd(false)}>
          <Input label="Objetivo" value={nText} onChange={setNText} placeholder="Descreva o objetivo do paciente..." dark />
          <Input label="Recompensa em XP" value={nXp} onChange={setNXp} type="number" placeholder="15" dark />
          <Input label="Prazo (opcional)" value={nDeadline} onChange={setNDeadline} type="date" dark />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,.04)', border:'1px solid rgba(3,187,133,.12)', borderRadius:10, padding:'13px 16px', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.8)', fontWeight:500 }}>Visível para o paciente</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>O paciente verá este objetivo</div>
            </div>
            <div onClick={() => setNVisible(!nVisible)} style={{ width:46, height:26, borderRadius:13, background:nVisible?'#03bb85':'rgba(255,255,255,.12)', display:'flex', alignItems:'center', padding:3, cursor:'pointer', justifyContent:nVisible?'flex-end':'flex-start', transition:'all .2s' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
            </div>
          </div>

          {addErr && <Alert type="error">{addErr}</Alert>}
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="dark" full onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button variant="primary" full onClick={addObj} loading={addLoad}>Salvar Objetivo</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
