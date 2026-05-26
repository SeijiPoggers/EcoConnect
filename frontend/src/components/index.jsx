/* ─────────────────────────────────────────────────────────
   EcoConnect — Shared UI Components
   ───────────────────────────────────────────────────────── */
import { useState } from 'react';

// ── Design tokens (JS mirror of CSS vars) ──────────────
export const C = {
  g900:'#005227', g700:'#038554', g500:'#03bb85', g300:'#68ddbd', g100:'#a4fff7',
  dark:'#0a1510', dark2:'#0d1f18', dark3:'#1a3329',
  text:'#0d1f18', muted:'#4a7060',
  off:'#f4faf7', gray100:'#ddeee8', gray200:'#b8d9cc',
};

// ── Avatar ─────────────────────────────────────────────
export function Avatar({ initials, size = 36, border, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #68ddbd, #03bb85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, color: C.g900, fontSize: size * 0.36, flexShrink: 0,
      border: border || 'none', ...style,
    }}>{initials}</div>
  );
}

// ── Badge ──────────────────────────────────────────────
const BADGE_COLORS = {
  green:  { bg:'rgba(3,187,133,.12)',  text:C.g700 },
  teal:   { bg:'rgba(104,221,189,.15)',text:C.g500 },
  orange: { bg:'rgba(255,160,60,.12)', text:'#b06010' },
  blue:   { bg:'rgba(60,120,255,.12)', text:'#3060c0' },
  red:    { bg:'rgba(220,60,60,.1)',   text:'#c04040' },
  dark:   { bg:'rgba(3,187,133,.15)',  text:C.g300 },
};

export function Badge({ children, color = 'green', style = {} }) {
  const s = BADGE_COLORS[color] || BADGE_COLORS.green;
  return (
    <span style={{
      padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.text, whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

// ── Button ─────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: { background:`linear-gradient(135deg,${C.g900},${C.g700})`, color:'#fff', border:'none' },
  outline: { background:'transparent', color:C.g700, border:`1.5px solid ${C.g500}` },
  ghost:   { background:'transparent', color:C.g500, border:'none' },
  danger:  { background:'rgba(220,60,60,.08)', color:'#c04040', border:'1px solid rgba(220,60,60,.2)' },
  dark:    { background:'rgba(3,187,133,.09)', color:C.g300, border:'1px solid rgba(3,187,133,.25)' },
};
const BTN_SIZES = {
  sm: { padding:'6px 14px',  fontSize:12, borderRadius:8  },
  md: { padding:'11px 22px', fontSize:14, borderRadius:10 },
  lg: { padding:'15px 28px', fontSize:15, borderRadius:12 },
};

export function Button({ children, onClick, variant='primary', size='md', full=false, style={}, disabled=false, loading=false }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const s = BTN_SIZES[size]      || BTN_SIZES.md;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...v, ...s, fontWeight: 600, fontFamily:'inherit',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading) ? .55 : 1,
        width: full ? '100%' : 'auto',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'opacity .18s, transform .12s',
        ...style,
      }}
    >
      {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────
export function Card({ children, dark=false, style={}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: dark ? 'rgba(255,255,255,.04)' : '#fff',
        border: `1px solid ${dark ? 'rgba(3,187,133,.12)' : C.gray100}`,
        borderRadius: 16, padding: 18,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: dark ? 'none' : (hov && onClick) ? '0 4px 20px rgba(0,82,39,.12)' : '0 1px 4px rgba(0,82,39,.06)',
        transform: (hov && onClick) ? 'translateY(-1px)' : 'none',
        transition: 'all .18s', ...style,
      }}
    >{children}</div>
  );
}

// ── Input ──────────────────────────────────────────────
export function Input({ label, value, onChange, type='text', placeholder='', dark=false, style={}, error }) {
  return (
    <div style={{ marginBottom: error ? 6 : 14 }}>
      {label && (
        <label style={{
          display:'block', fontSize:11, fontWeight:700,
          color: dark ? 'rgba(164,255,247,.6)' : C.muted,
          textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7,
        }}>{label}</label>
      )}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'13px 15px',
          border: `1.5px solid ${error ? '#e05050' : dark ? 'rgba(3,187,133,.2)' : C.gray100}`,
          borderRadius:10, fontSize:14,
          background: dark ? 'rgba(255,255,255,.05)' : C.off,
          color: dark ? '#fff' : C.text,
          outline:'none', boxSizing:'border-box', transition:'border-color .18s', ...style,
        }}
      />
      {error && <div style={{ fontSize:11, color:'#e05050', marginTop:5 }}>{error}</div>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder='', rows=4, dark=false }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && (
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:dark?'rgba(164,255,247,.6)':C.muted, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>{label}</label>
      )}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          width:'100%', padding:'12px 15px', resize:'vertical',
          border:`1.5px solid ${dark?'rgba(3,187,133,.2)':C.gray100}`,
          borderRadius:10, fontSize:14,
          background: dark?'rgba(255,255,255,.05)':C.off,
          color: dark?'#fff':C.text,
          outline:'none', boxSizing:'border-box',
        }}
      />
    </div>
  );
}

// ── XP Progress Bar ────────────────────────────────────
export function XpBar({ xp, level, dark=false, size='md' }) {
  const perLevel = 25;
  const xpInLevel = xp % perLevel;
  const pct = (xpInLevel / perLevel) * 100;
  const h = size === 'lg' ? 12 : 9;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
        <span style={{ fontSize:12, color:dark?'rgba(255,255,255,.55)':C.muted }}>⭐ {xp} XP</span>
        <span style={{ fontSize:12, fontWeight:700, color:dark?C.g300:C.g700 }}>Nível {level}</span>
      </div>
      <div style={{ height:h, background:dark?'rgba(255,255,255,.08)':C.gray100, borderRadius:h/2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${C.g700},${C.g300})`, borderRadius:h/2, transition:'width .6s ease' }} />
      </div>
      <div style={{ fontSize:10, color:dark?'rgba(255,255,255,.3)':C.muted, marginTop:5 }}>
        {xpInLevel} / {perLevel} XP → Nível {level + 1}
      </div>
    </div>
  );
}

// ── Toggle Switch ──────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <div
      role="switch" aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width:46, height:26, borderRadius:13,
        background: value ? C.g500 : 'rgba(255,255,255,.15)',
        display:'flex', alignItems:'center', padding:3,
        cursor:'pointer', transition:'background .2s',
        justifyContent: value ? 'flex-end' : 'flex-start',
        flexShrink:0,
      }}
    >
      <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'all .2s' }} />
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────
export function Modal({ children, onClose, title, dark=true }) {
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.62)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}
    >
      <div
        style={{
          background: dark ? C.dark2 : '#fff',
          border: `1px solid ${dark?'rgba(3,187,133,.15)':C.gray100}`,
          borderRadius:22, padding:26, width:'100%', maxWidth:490,
          maxHeight:'90vh', overflowY:'auto',
          boxShadow:'0 24px 70px rgba(0,0,0,.5)', animation:'slideUp .28s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h3 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:18, color: dark?'#fff':C.text, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color: dark?'rgba(255,255,255,.4)':C.muted, fontSize:22, lineHeight:1, cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Section Title ──────────────────────────────────────
export function SectionTitle({ children, dark=false, action, style={} }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, ...style }}>
      <h3 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:17, fontWeight:600, margin:0, color:dark?'rgba(255,255,255,.88)':C.text }}>{children}</h3>
      {action}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────
export function EmptyState({ emoji, title, sub, dark=false }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:38, marginBottom:12 }}>{emoji}</div>
      <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:15, fontWeight:600, color:dark?'rgba(255,255,255,.7)':C.text, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:dark?'rgba(255,255,255,.35)':C.muted, lineHeight:1.5 }}>{sub}</div>
    </div>
  );
}

// ── Filter Chips ───────────────────────────────────────
export function FilterChips({ options, active, onChange, dark=false }) {
  return (
    <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, flexWrap:'wrap' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
            background: active===opt ? C.g500 : (dark?'rgba(255,255,255,.05)':'#fff'),
            border: `1.5px solid ${active===opt ? C.g500 : dark?'rgba(3,187,133,.18)':C.gray100}`,
            color: active===opt ? '#fff' : (dark?'rgba(255,255,255,.5)':C.muted),
            cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s', flexShrink:0,
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

// ── Search Bar ─────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder='Buscar...', dark=false }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      background: dark?'rgba(255,255,255,.05)':'#fff',
      border: `1.5px solid ${dark?'rgba(3,187,133,.18)':C.gray100}`,
      borderRadius:12, padding:'10px 14px', marginBottom:14,
    }}>
      <span style={{ fontSize:16, opacity:.5 }}>🔍</span>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border:'none', background:'transparent', fontSize:14, color:dark?'rgba(255,255,255,.8)':C.text, outline:'none', flex:1 }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background:'none', border:'none', color:dark?'rgba(255,255,255,.3)':C.gray200, fontSize:16, lineHeight:1 }}>✕</button>
      )}
    </div>
  );
}

// ── Alert ──────────────────────────────────────────────
export function Alert({ children, type='error' }) {
  const s = type==='error'
    ? { bg:'rgba(220,60,60,.08)', border:'rgba(220,60,60,.22)', text:'#c04040' }
    : { bg:'rgba(3,187,133,.09)', border:'rgba(3,187,133,.28)', text:C.g700 };
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:'10px 14px', fontSize:13, color:s.text, marginBottom:14 }}>
      {type==='error'?'⚠️':'✅'} {children}
    </div>
  );
}

export default function Spinner({ size=28, color='#03bb85' }) {
  return (
    <div style={{ width:size, height:size, border:`3px solid rgba(3,187,133,.12)`, borderTop:`3px solid ${color}`, borderRadius:'50%', animation:'spin .75s linear infinite' }} />
  );
}
