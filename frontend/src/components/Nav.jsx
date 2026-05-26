import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './index';

// ── Tab configs ───────────────────────────────────────
const PATIENT_TABS = [
  { to:'/app',          icon:'🏠', label:'Home',          exact:true  },
  { to:'/app/orgs',     icon:'🏢', label:'Organizações'              },
  { to:'/app/consultas',icon:'📅', label:'Consultas'                 },
  { to:'/app/contato',  icon:'💬', label:'Contato'                   },
  { to:'/app/perfil',   icon:'👤', label:'Perfil'                    },
];
const PRO_TABS = [
  { to:'/pro',              icon:'🏠', label:'Home',     exact:true },
  { to:'/pro/pacientes',    icon:'👥', label:'Pacientes'            },
  { to:'/pro/objetivos',    icon:'✅', label:'Objetivos'            },
  { to:'/pro/logs',         icon:'📝', label:'Logs'                 },
  { to:'/pro/perfil',       icon:'👤', label:'Perfil'               },
];

// ── Shared nav link styles ─────────────────────────────
function NavBtn({ to, icon, label, exact, dark }) {
  const { pathname } = useLocation();
  const isActive = exact ? pathname === to : pathname.startsWith(to) && to !== (dark ? '/pro' : '/app');
  const exactActive = exact ? pathname === to : false;
  const active = exact ? exactActive : (pathname.startsWith(to) && to.split('/').length > 2);
  const finalActive = exact ? pathname === to : pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={exact}
      style={{ textDecoration:'none', display:'contents' }}
    >
      {({ isActive }) => (
        <>
          {/* Desktop version */}
          <button className="hide-mobile" style={{
            padding:'8px 14px', borderRadius:9, border:'none',
            background: isActive ? `rgba(3,187,133,.12)` : 'transparent',
            color: isActive ? (dark ? '#68ddbd' : '#038554') : (dark ? 'rgba(255,255,255,.45)' : '#4a7060'),
            fontWeight: isActive ? 700 : 400,
            fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{icon}</span> {label}
          </button>

          {/* Mobile version */}
          <button className="show-mobile" style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background:'none', border:'none', cursor:'pointer', padding:'4px 8px', minWidth:48,
            flex:1,
          }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:9, fontFamily:'inherit', fontWeight: isActive?700:400, color: isActive?(dark?'#68ddbd':'#038554'):(dark?'rgba(255,255,255,.35)':'#4a7060') }}>{label}</span>
            {isActive && <div style={{ width:4, height:4, borderRadius:'50%', background:'#03bb85' }} />}
          </button>
        </>
      )}
    </NavLink>
  );
}

export default function Nav({ dark = false }) {
  const { user } = useAuth();
  const tabs = dark ? PRO_TABS : PATIENT_TABS;

  const navBg    = dark ? '#0d1f18' : '#fff';
  const border   = dark ? '1px solid rgba(3,187,133,.1)' : '1px solid #ddeee8';
  const logoColor = dark ? '#03bb85' : '#038554';

  return (
    <>
      {/* ── Top Nav ── */}
      <nav style={{
        background: navBg, borderBottom: border,
        padding: '0 clamp(16px,4vw,32px)',
        height: 64, display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:50,
        boxShadow: dark ? 'none' : '0 1px 4px rgba(0,82,39,.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🌿</span>
          <span style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:20, fontWeight:700, color:logoColor, letterSpacing:'-0.5px' }}>EcoConnect</span>
          {dark && (
            <span style={{ background:'rgba(3,187,133,.12)', border:'1px solid rgba(3,187,133,.22)', borderRadius:20, padding:'2px 10px', fontSize:10, color:'#68ddbd', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Admin</span>
          )}
        </div>

        {/* Desktop tabs */}
        <div className="hide-mobile" style={{ display:'flex', gap:2 }}>
          {tabs.map(t => <NavBtn key={t.to} {...t} dark={dark} />)}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:19, cursor:'pointer', opacity:.7 }}>🔔</span>
          <Avatar initials={user?.avatar || '?'} size={34} />
        </div>
      </nav>

      {/* ── Bottom Mobile Nav ── */}
      <nav className="show-mobile" style={{
        position:'fixed', bottom:0, left:0, right:0,
        background: navBg, borderTop: border,
        display:'flex', justifyContent:'space-around',
        padding:`8px 0 max(14px,env(safe-area-inset-bottom))`,
        zIndex:50,
        boxShadow: dark ? 'none' : '0 -2px 12px rgba(0,82,39,.07)',
      }}>
        {tabs.map(t => <NavBtn key={t.to} {...t} dark={dark} />)}
      </nav>
    </>
  );
}
