import { useState, useEffect } from 'react';
import { patientsAPI } from '../../services/api';
import { Card, SectionTitle, SearchBar, XpBar, EmptyState, Avatar } from '../../components/index';
import Spinner from '../../components/Spinner';

export default function ProPatients() {
  const [patients, setPatients] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    patientsAPI.list().then(d => { setPatients(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const shown = patients.filter(p =>
    !search ||
    p.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition?.toLowerCase().includes(search.toLowerCase())
  );

  const conditionLabel = { TEA:'TEA', ADHD:'TDAH', DYSLEXIA:'Dislexia', DYSPRAXIA:'Dyspraxia', OTHER:'Outra', UNSPECIFIED:'Não especificada' };

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      <SectionTitle dark>
        👥 Meus Pacientes{' '}
        <span style={{ fontSize:13, fontWeight:400, color:'rgba(255,255,255,.3)' }}>{patients.length} total</span>
      </SectionTitle>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou condição..." dark />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner size={36} color="#03bb85" /></div>
      ) : shown.length === 0 ? (
        <Card dark><EmptyState emoji="👥" title="Nenhum paciente" sub="Nenhum resultado encontrado" dark /></Card>
      ) : shown.map(p => (
        <Card dark key={p.id} style={{ marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:13 }}>
            <Avatar initials={p.user?.avatar || '?'} size={46} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'rgba(255,255,255,.9)' }}>{p.user?.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.38)', marginTop:2 }}>
                {conditionLabel[p.condition] || p.condition}
              </div>
              <div style={{ marginTop:8 }}>
                <XpBar xp={p.xp} level={p.level} dark />
              </div>
            </div>
            <span style={{ color:'rgba(255,255,255,.18)', fontSize:20 }}>›</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
