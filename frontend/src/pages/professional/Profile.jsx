import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { professionalsAPI } from '../../services/api';
import { Card, SectionTitle } from '../../components/index';
import { Avatar } from '../../components/index';

export default function ProProfile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalPatients:0, objetivosConcluidos:0, taxaProgresso:0 });

  useEffect(() => {
    professionalsAPI.stats().then(setStats).catch(() => {});
  }, []);

  const menuItems = [
    { e:'🪪', l:'Dados Profissionais'  },
    { e:'👥', l:'Gerenciar Pacientes'  },
    { e:'📊', l:'Relatórios e Métricas'},
    { e:'🔔', l:'Notificações'         },
    { e:'🔒', l:'Privacidade e LGPD'   },
    { e:'ℹ️', l:'Sobre o EcoConnect'   },
  ];

  return (
    <div className="fade-in" style={{ paddingTop:22 }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0a1510,#005227)', borderRadius:22, padding:'28px 22px', textAlign:'center', marginBottom:20 }}>
        <Avatar initials={user?.avatar || '?'} size={76} style={{ margin:'0 auto 14px', border:'4px solid rgba(3,187,133,.3)' }} />
        <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:22, color:'#fff', fontWeight:700 }}>{user?.name}</div>
        <div style={{ fontSize:12, color:'#68ddbd', marginTop:4 }}>{user?.professionalProfile?.specialty}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:3 }}>{user?.professionalProfile?.crp}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:28, marginTop:18 }}>
          {[[stats.totalPatients,'Pacientes'],[stats.objetivosConcluidos,'Objetivos'],[`${stats.taxaProgresso}%`,'Progresso']].map(([n,l]) => (
            <div key={l}>
              <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:20, color:'#fff', fontWeight:700 }}>{n}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {menuItems.map(item => (
        <div key={item.l} style={{ display:'flex', alignItems:'center', gap:13, padding:'14px 18px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(3,187,133,.08)', borderRadius:13, marginBottom:8, cursor:'pointer', transition:'background .15s' }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'rgba(3,187,133,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{item.e}</div>
          <div style={{ flex:1, fontSize:14, fontWeight:500, color:'rgba(255,255,255,.85)' }}>{item.l}</div>
          <span style={{ color:'rgba(255,255,255,.2)', fontSize:18 }}>›</span>
        </div>
      ))}

      <div
        onClick={logout}
        style={{ display:'flex', alignItems:'center', gap:13, padding:'14px 18px', background:'rgba(220,60,60,.06)', border:'1px solid rgba(220,60,60,.16)', borderRadius:13, marginTop:4, cursor:'pointer' }}
      >
        <div style={{ width:38, height:38, borderRadius:10, background:'rgba(220,60,60,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚪</div>
        <div style={{ flex:1, fontSize:14, fontWeight:500, color:'#e06060' }}>Encerrar sessão</div>
      </div>
    </div>
  );
}
