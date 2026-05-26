import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Alert } from '../components/index';

const CONDITIONS = [
  { value:'UNSPECIFIED',  label:'Prefiro não informar' },
  { value:'TEA',          label:'TEA (Transtorno do Espectro Autista)' },
  { value:'ADHD',         label:'TDAH' },
  { value:'DYSLEXIA',     label:'Dislexia' },
  { value:'DYSPRAXIA',    label:'Dyspraxia' },
  { value:'OTHER',        label:'Outra' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]       = useState('PATIENT');   // PATIENT | PROFESSIONAL
  const [tab, setTab]         = useState('login');      // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // form fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [condition, setCondition] = useState('UNSPECIFIED');

  const isPro = mode === 'PROFESSIONAL';

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    if (tab === 'register' && !name) { setError('Informe seu nome.'); return; }

    setLoading(true);
    try {
      if (tab === 'register') {
        await register({ email, password, name, condition });
        navigate('/app');
      } else {
        const user = await login(email, password, mode);
        navigate(user.role === 'PROFESSIONAL' ? '/pro' : '/app');
      }
    } catch (e) {
      setError(e?.error || e?.message || 'Erro ao entrar. Verifique seus dados.');
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{
      minHeight: '100vh',
      background: isPro
        ? 'linear-gradient(160deg,#050e09 0%,#0a1510 50%,#005227 100%)'
        : 'linear-gradient(160deg,#005227 0%,#038554 45%,#03bb85 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px 16px', transition:'background .5s', position:'relative', overflow:'hidden',
    }}>
      {/* BG decorative circles */}
      <div style={{ position:'absolute', top:-100, right:-100, width:380, height:380, borderRadius:'50%', background: isPro?'rgba(3,187,133,.07)':'rgba(164,255,247,.12)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, left:-80, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1, animation:'fadeIn .4s ease' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:54, marginBottom:10 }}>🌿</div>
          <div style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:38, fontWeight:700, color:'#fff', letterSpacing:'-1px' }}>EcoConnect</div>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:14, marginTop:8, lineHeight:1.55 }}>
            Conectando pessoas a organizações que transformam vidas
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: isPro ? 'rgba(13,31,24,.97)' : '#fff',
          borderRadius:28, padding:'28px 26px 32px',
          boxShadow:'0 20px 60px rgba(0,0,0,.28)',
          border: isPro ? '1px solid rgba(3,187,133,.13)' : 'none',
          backdropFilter:'blur(12px)',
        }}>

          {/* ── Mode Toggle ── */}
          <div
            onClick={() => { setMode(isPro?'PATIENT':'PROFESSIONAL'); setError(''); }}
            style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background: isPro ? 'rgba(255,255,255,.05)' : '#f4faf7',
              border:`1px solid ${isPro?'rgba(3,187,133,.15)':'#ddeee8'}`,
              borderRadius:13, padding:'11px 14px', marginBottom:22, cursor:'pointer',
            }}
          >
            <div>
              <div style={{ fontSize:12, fontWeight:700, color: isPro?'#68ddbd':'#038554', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {isPro ? '⚕️ Modo Profissional' : '👤 Modo Paciente'}
              </div>
              <div style={{ fontSize:11, color: isPro?'rgba(255,255,255,.35)':'#4a7060', marginTop:2 }}>
                {isPro ? 'Clique para entrar como paciente' : 'Clique para entrar como profissional'}
              </div>
            </div>
            {/* Pill toggle */}
            <div style={{
              width:52, height:28, borderRadius:14,
              background: isPro ? '#038554' : '#ddeee8',
              display:'flex', alignItems:'center', padding:3,
              justifyContent: isPro ? 'flex-end' : 'flex-start',
              transition:'all .25s',
            }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
            </div>
          </div>

          {/* Professional badge */}
          {isPro && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(3,187,133,.12)', border:'1px solid rgba(3,187,133,.26)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'#68ddbd', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:18 }}>
              ⚕️ Acesso Profissional
            </div>
          )}

          {/* ── Login / Register tabs (patients only) ── */}
          {!isPro && (
            <div style={{ display:'flex', background:'#f4faf7', borderRadius:11, padding:4, marginBottom:22 }}>
              {['login','register'].map(t => (
                <div
                  key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                  style={{
                    flex:1, textAlign:'center', padding:'9px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer',
                    background: tab===t ? '#fff' : 'transparent',
                    color: tab===t ? '#038554' : '#4a7060',
                    boxShadow: tab===t ? '0 1px 4px rgba(0,82,39,.09)' : 'none',
                    transition:'all .2s',
                  }}
                >
                  {t === 'login' ? 'Entrar' : 'Cadastrar'}
                </div>
              ))}
            </div>
          )}

          {/* Heading */}
          <h2 style={{ fontFamily:'Fraunces,Georgia,serif', fontSize:22, fontWeight:600, margin:'0 0 4px', color: isPro?'#fff':'#0d1f18' }}>
            {isPro ? 'Portal do Profissional' : tab==='login' ? 'Bem-vindo de volta' : 'Criar conta gratuita'}
          </h2>
          <p style={{ fontSize:13, color: isPro?'rgba(255,255,255,.4)':'#4a7060', marginBottom:22 }}>
            {isPro ? 'Autenticação segura para equipe clínica' : tab==='login' ? 'Acesse sua conta para continuar' : 'Comece sua jornada de bem-estar'}
          </p>

          {/* ── Form Fields ── */}
          {tab === 'register' && !isPro && (
            <Input label="Nome completo" value={name} onChange={setName} placeholder="Seu nome completo" onKeyDown={handleKey} />
          )}

          <Input label="E-mail" value={email} onChange={setEmail} type="email"
            placeholder={isPro ? 'profissional@ecoconnect.com' : 'seu@email.com'}
            dark={isPro} onKeyDown={handleKey} />

          <Input label="Senha" value={password} onChange={setPassword} type="password"
            placeholder="••••••••" dark={isPro} onKeyDown={handleKey} />

          {tab === 'register' && !isPro && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4a7060', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:7 }}>
                Condição (opcional)
              </label>
              <select
                value={condition} onChange={e => setCondition(e.target.value)}
                style={{ width:'100%', padding:'13px 15px', border:'1.5px solid #ddeee8', borderRadius:10, fontSize:14, background:'#f4faf7', color:'#0d1f18', fontFamily:'inherit', outline:'none' }}
              >
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {error   && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <Button variant="primary" full size="lg" onClick={handleSubmit} loading={loading} style={{ marginTop:4 }}>
            {isPro ? 'Acessar painel' : tab==='login' ? 'Entrar na plataforma' : 'Criar minha conta'}
          </Button>

          {/* Demo credentials hint */}
          <div style={{ marginTop:20, padding:'11px 14px', background: isPro?'rgba(3,187,133,.06)':'rgba(0,82,39,.04)', borderRadius:10, fontSize:11, color: isPro?'rgba(255,255,255,.35)':'#4a7060' }}>
            <strong>Demo:</strong>{' '}
            {isPro ? 'paulo@ecoconnect.com / admin123' : 'maria@email.com / 123456'}
          </div>

          {tab === 'login' && !isPro && (
            <div style={{ textAlign:'center', marginTop:14 }}>
              <span style={{ fontSize:12, color:'#038554', cursor:'pointer' }}>Esqueci minha senha</span>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
