'use client';

import { useEffect, useRef, useState } from 'react';
import { setSessionProfile, useSession } from '@/hooks/useSession';

/* ─── Types ──────────────────────────────────────────── */
interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
  medicalHistory: string;
  avatarUrl?: string | null;
}

interface PatientProfileResponse {
  profile: PatientProfile;
}

interface AvatarUploadResponse {
  avatarUrl: string;
}

type Section = 'personal' | 'health' | 'emergency';

const INITIAL: PatientProfile = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  height: '',
  weight: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  allergies: '',
  medicalHistory: '',
};

function calcAge(dob: string) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

function initials(f: string, l: string) {
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

/* ─── Shared sub-components (mirrors doctor profile) ─── */
function SectionCard({
  title, subtitle, icon, children, editing, onEdit, onSave, onCancel, saving,
}: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode;
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">{icon}</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-all duration-150">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-150">Cancel</button>
            <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 px-4 py-1.5 rounded-lg transition-all duration-150 shadow-sm">
              {saving ? (
                <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving…</>
              ) : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label, value, editing, name, type = 'text', onChange, isTextarea = false, suffix,
}: {
  label: string; value: string; editing: boolean; name: keyof PatientProfile;
  type?: string; onChange: (n: keyof PatientProfile, v: string) => void;
  isTextarea?: boolean; suffix?: string;
}) {
  const base = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-150';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {editing ? (
        isTextarea
          ? <textarea name={name} value={value} rows={3} onChange={e => onChange(name, e.target.value)} className={`${base} resize-none`} />
          : <div className="flex items-center gap-2">
              <input type={type} name={name} value={value} onChange={e => onChange(name, e.target.value)} className={base} />
              {suffix && <span className="text-xs text-slate-400 flex-shrink-0">{suffix}</span>}
            </div>
      ) : (
        <p className={`text-sm py-1 ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
          {value ? (suffix ? `${value} ${suffix}` : value) : '—'}
        </p>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function PatientProfile() {
  const session = useSession();
  const [profile, setProfile] = useState<PatientProfile>(INITIAL);
  const [draft, setDraft] = useState<PatientProfile>(INITIAL);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [savingSection, setSavingSection] = useState<Section | null>(null);
  const [savedSection, setSavedSection] = useState<Section | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.token) {
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/patient/profile`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const data = (await response.json()) as PatientProfileResponse;
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load profile');
        }

      setProfile(data.profile);
      setDraft(data.profile);
      setAvatarPreview(data.profile.avatarUrl ?? null);
      if (session?.user) {
        setSessionProfile(session.user.role, {
          id: data.profile.id,
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          avatarUrl: data.profile.avatarUrl ?? null,
        });
      }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session?.token]);

  const startEdit = (s: Section) => { setDraft({ ...profile }); setEditingSection(s); setSavedSection(null); };
  const cancelEdit = () => setEditingSection(null);
  const handleChange = (n: keyof PatientProfile, v: string) => setDraft(prev => ({ ...prev, [n]: v }));

  const saveSection = async (s: Section) => {
    if (!session?.token) return;
    setSavingSection(s);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/patient/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as PatientProfileResponse;
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to update profile');
      }

      setProfile(data.profile);
      setDraft(data.profile);
      if (session?.user) {
        setSessionProfile(session.user.role, {
          id: data.profile.id,
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          avatarUrl: data.profile.avatarUrl ?? null,
        });
      }
      setSavingSection(null);
      setEditingSection(null);
      setSavedSection(s);
      setTimeout(() => setSavedSection(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      setSavingSection(null);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.token) return;

    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setIsAvatarUploading(true);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${apiBaseUrl}/api/patient/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });

      const data = (await response.json()) as AvatarUploadResponse;
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to upload avatar');
      }

      setProfile((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      setDraft((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      setAvatarPreview(data.avatarUrl);
      if (session?.user) {
        setSessionProfile(session.user.role, {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: data.avatarUrl,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const isEditing = (s: Section) => editingSection === s;
  const isSaving  = (s: Section) => savingSection === s;
  const dp = editingSection ? draft : profile;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 text-slate-600 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-4xl">
        <div className="bg-red-50 border border-red-100 rounded-2xl shadow-sm p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Profile</h1>
        <p className="text-slate-500 text-sm md:text-base">Manage your personal and medical information.</p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Identity hero card ─────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white text-3xl font-black shadow-md">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  : initials(profile.firstName, profile.lastName)}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isAvatarUploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white flex items-center justify-center shadow transition-colors duration-150"
                title="Change photo"
              >
                {isAvatarUploading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>

            {/* Name + meta */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-slate-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-cyan-600 font-semibold text-sm mt-0.5">{calcAge(profile.dateOfBirth)} years old</p>
              <p className="text-slate-400 text-xs mt-1">{profile.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="text-xs font-semibold bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full">
                  Blood Type: {profile.bloodType}
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {profile.height} cm · {profile.weight} kg
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {profile.gender}
                </span>
              </div>
            </div>

          </div>

          {/* Saved toast */}
          {savedSection && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
              </svg>
              {savedSection.charAt(0).toUpperCase() + savedSection.slice(1)} information saved successfully.
            </div>
          )}
        </div>

        {/* ── Personal Information ───────────────────── */}
        <SectionCard
          title="Personal Information" subtitle="Your basic personal details"
          editing={isEditing('personal')} onEdit={() => startEdit('personal')}
          onSave={() => saveSection('personal')} onCancel={cancelEdit} saving={isSaving('personal')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First Name"    value={dp.firstName}   name="firstName"   editing={isEditing('personal')} onChange={handleChange} />
            <Field label="Last Name"     value={dp.lastName}    name="lastName"    editing={isEditing('personal')} onChange={handleChange} />
            <Field label="Email Address" value={dp.email}       name="email"       editing={isEditing('personal')} onChange={handleChange} type="email" />
            <Field label="Phone Number"  value={dp.phone}       name="phone"       editing={isEditing('personal')} onChange={handleChange} type="tel" />
            <Field label="Date of Birth" value={dp.dateOfBirth} name="dateOfBirth" editing={isEditing('personal')} onChange={handleChange} type="date" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Gender</label>
              {isEditing('personal') ? (
                <select value={draft.gender} onChange={e => handleChange('gender', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-150">
                  {['Male','Female','Non-binary','Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-sm text-slate-800 py-1">{dp.gender || '—'}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Field label="Home Address" value={dp.address} name="address" editing={isEditing('personal')} onChange={handleChange} />
            </div>
          </div>
        </SectionCard>

        {/* ── Health Information ─────────────────────── */}
        <SectionCard
          title="Health Information" subtitle="Biometrics, allergies, and medical history"
          editing={isEditing('health')} onEdit={() => startEdit('health')}
          onSave={() => saveSection('health')} onCancel={cancelEdit} saving={isSaving('health')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Height" value={dp.height} name="height" editing={isEditing('health')} onChange={handleChange} type="number" suffix="cm" />
            <Field label="Weight" value={dp.weight} name="weight" editing={isEditing('health')} onChange={handleChange} type="number" suffix="kg" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Blood Type</label>
              {isEditing('health') ? (
                <select value={draft.bloodType} onChange={e => handleChange('bloodType', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-150">
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <p className="text-sm text-slate-800 py-1">{dp.bloodType || '—'}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Field label="Known Allergies" value={dp.allergies} name="allergies" editing={isEditing('health')} onChange={handleChange} isTextarea />
            </div>
            <div className="sm:col-span-2">
              <Field label="Medical History / Conditions" value={dp.medicalHistory} name="medicalHistory" editing={isEditing('health')} onChange={handleChange} isTextarea />
            </div>
          </div>
        </SectionCard>

        {/* ── Emergency Contact ──────────────────────── */}
        <SectionCard
          title="Emergency Contact" subtitle="Who to notify in case of emergency"
          editing={isEditing('emergency')} onEdit={() => startEdit('emergency')}
          onSave={() => saveSection('emergency')} onCancel={cancelEdit} saving={isSaving('emergency')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Contact Name & Relationship" value={dp.emergencyContact} name="emergencyContact" editing={isEditing('emergency')} onChange={handleChange} />
            <Field label="Contact Phone"               value={dp.emergencyPhone}   name="emergencyPhone"   editing={isEditing('emergency')} onChange={handleChange} type="tel" />
          </div>
        </SectionCard>

      </div>
    </div>
  );
}

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║         BACKEND IMPLEMENTATION NOTES — PATIENT PROFILE       ║
 ╚══════════════════════════════════════════════════════════════╝

 ── FETCH PROFILE ────────────────────────────────────────────

 1. GET /api/patient/profile
    Auth: Bearer token (patient role required).
    Response: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;        // "YYYY-MM-DD"
      gender: string;
      avatarUrl: string | null;
      bloodType: string;
      height: number;             // cm
      weight: number;             // kg
      address: string;
      allergies: string;
      medicalHistory: string;
      emergencyContact: string;
      emergencyPhone: string;
      stats: {
        totalConsultations: number;
        activeConditions: number;
      };
    }

 ── UPDATE PROFILE ───────────────────────────────────────────

 2. PUT /api/patient/profile
    Partial update – send only changed fields.
    Request:  Partial<PatientProfile> (JSON body)
    Response: { success: boolean; updatedAt: string }

    Validation:
    - email: unique constraint, send verification email on change.
    - phone: E.164 format.
    - dateOfBirth: must be in the past, patient must be >= 0 years old.
    - height / weight: positive numbers with reasonable upper bounds.
    - bloodType: must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-.

 ── AVATAR UPLOAD ────────────────────────────────────────────

 3. POST /api/patient/profile/avatar
    Content-Type: multipart/form-data  |  field: "avatar"
    Max size: 5 MB  |  Types: image/jpeg, image/png, image/webp
    Response: { avatarUrl: string }

    Implementation:
    - Resize to 400×400 with Sharp before storage.
    - Store in Supabase Storage: "patient-avatars/{patientId}.webp"
    - Return public CDN URL; update avatarUrl column.

 ── DATA MODEL ───────────────────────────────────────────────

  patients table:
    id                UUID PK
    userId            UUID FK → users.id
    firstName         TEXT
    lastName          TEXT
    email             TEXT UNIQUE
    phone             TEXT
    dateOfBirth       DATE
    gender            TEXT
    avatarUrl         TEXT NULL
    bloodType         TEXT
    height            NUMERIC
    weight            NUMERIC
    address           TEXT
    allergies         TEXT
    medicalHistory    TEXT
    emergencyContact  TEXT
    emergencyPhone    TEXT
    createdAt         TIMESTAMPTZ
    updatedAt         TIMESTAMPTZ

 ── SECURITY ─────────────────────────────────────────────────

  - JWT required; role must be "patient".
  - Row-level policy: patients read/update only their own row.
  - All profile mutations logged to audit_log table.
  - Sensitive fields (DOB, address) encrypted at rest.
*/
