import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, patientsAPI, professionalsAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null); // patientProfile or professionalProfile
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage ─────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('eco_token');
      const cached = localStorage.getItem('eco_user');
      if (!token) { setLoading(false); return; }

      try {
        if (cached) setUser(JSON.parse(cached));
        const { user: fresh } = await authAPI.me();
        setUser(fresh);
        localStorage.setItem('eco_user', JSON.stringify(fresh));
        await loadProfile(fresh);
      } catch {
        localStorage.removeItem('eco_token');
        localStorage.removeItem('eco_user');
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadProfile = useCallback(async (u) => {
    try {
      if (u.role === 'PATIENT') {
        const p = await patientsAPI.me();
        setProfile(p);
      } else {
        const p = await professionalsAPI.me();
        setProfile(p);
      }
    } catch { /* profile may not exist yet */ }
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = async (email, password, role) => {
    const { token, user } = await authAPI.login({ email, password, role });
    localStorage.setItem('eco_token', token);
    localStorage.setItem('eco_user', JSON.stringify(user));
    setUser(user);
    await loadProfile(user);
    return user;
  };

  // ── Register ───────────────────────────────────────────
  const register = async (data) => {
    const { token, user } = await authAPI.register(data);
    localStorage.setItem('eco_token', token);
    localStorage.setItem('eco_user', JSON.stringify(user));
    setUser(user);
    await loadProfile(user);
    return user;
  };

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    setUser(null);
    setProfile(null);
  };

  // ── Refresh profile (e.g. after XP update) ─────────────
  const refreshProfile = () => user && loadProfile(user);

  const isPatient      = user?.role === 'PATIENT';
  const isProfessional = user?.role === 'PROFESSIONAL';

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isPatient, isProfessional,
      login, register, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
