'use client';

import { useEffect, useRef, useState } from 'react';
import { setSessionProfile, useSession } from '@/hooks/useSession';

/* ─── Types ──────────────────────────────────────────── */
interface DoctorProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  // Professional
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: string;
  institution: string;
  biography: string;
  // Contact / location
  consultationFee: string;
  languages: string;
  address: string;
  avatarUrl?: string | null;
}

interface DoctorProfileResponse {
  profile: DoctorProfile;
}

interface AvatarUploadResponse {
  avatarUrl: string;
}

type Section = 'personal' | 'professional' | 'contact';

/* ─── Mock data ──────────────────────────────────────── */
const INITIAL_PROFILE: DoctorProfile = {
  firstName: 'Aris',
  lastName: 'Reyes',
  email: 'dr.aris.reyes@curis.health',
  phone: '+63 917 123 4567',
  dateOfBirth: '1985-03-14',
  gender: 'Male',
  specialization: 'Internal Medicine',
  licenseNumber: 'PRC-MED-2010-04521',
  yearsOfExperience: '14',
  institution: 'Philippine General Hospital',
  biography:
    'Dr. Aris Reyes is a board-certified internist with 14 years of experience in managing complex chronic conditions. He is committed to patient-centered care through evidence-based medicine and leverages telemedicine to extend quality healthcare access.',
  consultationFee: '500',
  languages: 'English, Filipino',
  address: 'Makati City, Metro Manila, Philippines',
};

const SPECIALTIES = [
  'Cardiology','Dermatology','Endocrinology','Gastroenterology','General Practice',
  'Hematology','Internal Medicine','Nephrology','Neurology','Oncology',
  'Ophthalmology','Orthopedics','Pediatrics','Psychiatry','Pulmonology',
  'Radiology','Rheumatology','Surgery','Urology','Other'
];

/* ─── Helpers ────────────────────────────────────────── */
function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/* ─── Sub-components ─────────────────────────────────── */
function SectionCard({
  title,
  subtitle,
  icon,
  children,
  editing,
  onEdit,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 px-4 py-1.5 rounded-lg transition-all duration-150 shadow-sm"
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  name,
  type = 'text',
  onChange,
  isTextarea = false,
  prefix,
}: {
  label: string;
  value: string;
  editing: boolean;
  name: keyof DoctorProfile;
  type?: string;
  onChange: (name: keyof DoctorProfile, value: string) => void;
  isTextarea?: boolean;
  prefix?: string;
}) {
  const base =
    'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-150 bg-slate-50';

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {editing ? (
        isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={e => onChange(name, e.target.value)}
            rows={4}
            className={`${base} resize-none`}
          />
        ) : prefix ? (
          <div className="flex">
            <span className="flex items-center px-3 border border-r-0 border-slate-200 rounded-l-xl bg-slate-100 text-slate-500 text-sm font-medium">
              {prefix}
            </span>
            <input
              type={type}
              name={name}
              value={value}
              onChange={e => onChange(name, e.target.value)}
              className={`${base} rounded-l-none`}
            />
          </div>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={e => onChange(name, e.target.value)}
            className={base}
          />
        )
      ) : (
        <p className={`text-sm text-slate-800 py-1 ${!value ? 'text-slate-400 italic' : ''}`}>
          {prefix && value ? `${prefix} ${value}` : value || '—'}
        </p>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function DoctorProfilePage() {
  const session = useSession();
  const [profile, setProfile] = useState<DoctorProfile>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<DoctorProfile>(INITIAL_PROFILE);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [savingSection, setSavingSection] = useState<Section | null>(null);
  const [savedSection, setSavedSection] = useState<Section | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const response = await fetch(`${apiBaseUrl}/api/doctor/profile`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const data = (await response.json()) as DoctorProfileResponse;
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || 'Failed to load profile');
        }

        setProfile(data.profile);
        setDraft(data.profile);
        setAvatarPreview(data.profile.avatarUrl ?? null);
        if (session?.user) {
          setSessionProfile(session.user.role, {
            id: data.profile.id,
            name: `Dr. ${data.profile.firstName} ${data.profile.lastName}`.trim(),
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

  /* helpers */
  const startEdit = (section: Section) => {
    setDraft({ ...profile });
    setEditingSection(section);
    setSavedSection(null);
  };

  const cancelEdit = () => setEditingSection(null);

  const handleChange = (name: keyof DoctorProfile, value: string) =>
    setDraft(prev => ({ ...prev, [name]: value }));

  const saveSection = async (section: Section) => {
    if (!session?.token) return;
    setSavingSection(section);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/doctor/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as DoctorProfileResponse;
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to update profile');
      }

      setProfile(data.profile);
      setDraft(data.profile);
      if (session?.user) {
        setSessionProfile(session.user.role, {
          id: data.profile.id,
          name: `Dr. ${data.profile.firstName} ${data.profile.lastName}`.trim(),
          avatarUrl: data.profile.avatarUrl ?? null,
        });
      }
      setSavingSection(null);
      setEditingSection(null);
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      setSavingSection(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const response = await fetch(`${apiBaseUrl}/api/doctor/profile/avatar`, {
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
          name: `Dr. ${profile.firstName} ${profile.lastName}`.trim(),
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
  const isSaving = (s: Section) => savingSection === s;

  const displayProfile = editingSection ? draft : profile;

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
      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Profile</h1>
        <p className="text-slate-500 text-sm md:text-base">
          Manage your professional information and credentials.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Identity hero card ─────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-3xl font-black shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials(profile.firstName, profile.lastName)
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white flex items-center justify-center shadow transition-colors duration-150"
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name + meta */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-slate-900">
                Dr. {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-teal-600 font-semibold text-sm mt-0.5">
                {profile.specialization
                  ? `${profile.specialization.charAt(0).toUpperCase()}${profile.specialization.slice(1)}`
                  : '—'}
              </p>
              <p className="text-slate-400 text-xs mt-1">{profile.institution}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {profile.yearsOfExperience} yrs experience
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {profile.languages}
                </span>
              </div>
            </div>

          </div>

          {/* Saved toast */}
          {savedSection && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
              </svg>
              {savedSection.charAt(0).toUpperCase() + savedSection.slice(1)} information saved successfully.
            </div>
          )}
        </div>

        {/* ── Personal Information ───────────────────── */}
        <SectionCard
          title="Personal Information"
          subtitle="Your basic personal details"
          editing={isEditing('personal')}
          onEdit={() => startEdit('personal')}
          onSave={() => saveSection('personal')}
          onCancel={cancelEdit}
          saving={isSaving('personal')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First Name"    value={displayProfile.firstName}   name="firstName"   editing={isEditing('personal')} onChange={handleChange} />
            <Field label="Last Name"     value={displayProfile.lastName}    name="lastName"    editing={isEditing('personal')} onChange={handleChange} />
            <Field label="Email Address" value={displayProfile.email}       name="email"       editing={isEditing('personal')} onChange={handleChange} type="email" />
            <Field label="Phone Number"  value={displayProfile.phone}       name="phone"       editing={isEditing('personal')} onChange={handleChange} type="tel" />
            <Field label="Date of Birth" value={displayProfile.dateOfBirth} name="dateOfBirth" editing={isEditing('personal')} onChange={handleChange} type="date" />
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Gender</label>
              {isEditing('personal') ? (
                <select
                  value={draft.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-150"
                >
                  {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-800 py-1">{displayProfile.gender || '—'}</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Professional Information ───────────────── */}
        <SectionCard
          title="Professional Information"
          subtitle="Your qualifications and medical credentials"
          editing={isEditing('professional')}
          onEdit={() => startEdit('professional')}
          onSave={() => saveSection('professional')}
          onCancel={cancelEdit}
          saving={isSaving('professional')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Specialization</label>
              {isEditing('professional') ? (
                <select
                  value={draft.specialization}
                  onChange={e => handleChange('specialization', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-150"
                >
                  <option value="">Select a specialty</option>
                  {SPECIALTIES.map(s => (
                    <option key={s} value={s.toLowerCase().replace(/ /g, '_')}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className={`text-sm text-slate-800 py-1 ${!displayProfile.specialization ? 'text-slate-400 italic' : ''}`}>
                  {displayProfile.specialization || '—'}
                </p>
              )}
            </div>
            <Field label="PRC License Number" value={displayProfile.licenseNumber}     name="licenseNumber"     editing={isEditing('professional')} onChange={handleChange} />
            <Field label="Years of Experience" value={displayProfile.yearsOfExperience} name="yearsOfExperience" editing={isEditing('professional')} onChange={handleChange} type="number" />
            <Field label="Institution / Hospital" value={displayProfile.institution}   name="institution"       editing={isEditing('professional')} onChange={handleChange} />
            <div className="sm:col-span-2">
              <Field label="Professional Biography" value={displayProfile.biography}   name="biography"         editing={isEditing('professional')} onChange={handleChange} isTextarea />
            </div>
          </div>
        </SectionCard>

        {/* ── Contact & Settings ─────────────────────── */}
        <SectionCard
          title="Contact & Consultation"
          subtitle="Location, languages, and fee settings"
          editing={isEditing('contact')}
          onEdit={() => startEdit('contact')}
          onSave={() => saveSection('contact')}
          onCancel={cancelEdit}
          saving={isSaving('contact')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Consultation Fee (PHP)" value={displayProfile.consultationFee} name="consultationFee" editing={isEditing('contact')} onChange={handleChange} type="number" prefix="₱" />
            <Field label="Languages Spoken"        value={displayProfile.languages}       name="languages"       editing={isEditing('contact')} onChange={handleChange} />
            <div className="sm:col-span-2">
              <Field label="Clinic / Home Address" value={displayProfile.address}        name="address"         editing={isEditing('contact')} onChange={handleChange} />
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║           BACKEND IMPLEMENTATION NOTES — DOCTOR PROFILE      ║
 ╚══════════════════════════════════════════════════════════════╝

 ── FETCH PROFILE ────────────────────────────────────────────

 1. GET /api/doctor/profile
    Returns the full profile for the currently authenticated doctor.
    Auth: Bearer token (doctor role required).
    Response: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;        // ISO date "YYYY-MM-DD"
      gender: string;
      avatarUrl: string | null;
      specialization: string;
      licenseNumber: string;      // PRC license
      yearsOfExperience: number;
      institution: string;
      biography: string;
      consultationFee: number;    // PHP
      languages: string[];
      address: string;
      isVerified: boolean;
      stats: {
        totalPatients: number;
        rating: number;           // avg from reviews
      };
    }

 ── UPDATE PROFILE ───────────────────────────────────────────

 2. PUT /api/doctor/profile
    Updates personal, professional, or contact fields.
    Send only the fields that changed (partial update / PATCH semantics).
    Request:  Partial<DoctorProfile>   (JSON body)
    Response: { success: boolean; updatedAt: string }

    Validation:
    - licenseNumber: verify format and optionally query PRC registry.
    - email: must be unique across all users; send verification email on change.
    - phone: E.164 format, optional OTP verification.
    - consultationFee: must be a positive number; max cap per platform policy.
    - yearsOfExperience: positive integer.

 ── AVATAR UPLOAD ────────────────────────────────────────────

 3. POST /api/doctor/profile/avatar
    Upload a new profile photo.
    Content-Type: multipart/form-data
    Field name:   "avatar"  (image/jpeg | image/png | image/webp, max 5 MB)
    Response: { avatarUrl: string }

    Implementation:
    - Resize / compress server-side (e.g., Sharp) before storage.
    - Store in Supabase Storage bucket: "doctor-avatars/{doctorId}.webp"
    - Return a signed or public CDN URL.
    - Update the avatarUrl column in the doctors table.

 ── DATA MODEL ───────────────────────────────────────────────

  doctors table:
    id                UUID PK
    userId            UUID FK → users.id
    firstName         TEXT
    lastName          TEXT
    email             TEXT UNIQUE
    phone             TEXT
    dateOfBirth       DATE
    gender            TEXT
    avatarUrl         TEXT NULL
    specialization    TEXT
    licenseNumber     TEXT UNIQUE
    yearsOfExperience INT
    institution       TEXT
    biography         TEXT
    consultationFee   NUMERIC(10, 2)
    languages         TEXT[]
    address           TEXT
    isVerified        BOOLEAN DEFAULT false
    createdAt         TIMESTAMPTZ
    updatedAt         TIMESTAMPTZ

  doctor_stats view (or materialised):
    doctorId          UUID FK
    totalPatients     INT     -- COUNT(DISTINCT appointments.patientId)
    avgRating         NUMERIC -- AVG(reviews.rating)

 ── CREDENTIAL VERIFICATION ──────────────────────────────────

  POST /api/doctor/profile/verify-license
    Admin-triggered endpoint to submit license to PRC verification.
    Sets isVerified = true on success.

 ── SECURITY NOTES ───────────────────────────────────────────

  - All profile endpoints require a valid JWT with role = "doctor".
  - Doctors can only read/update their own profile (row-level policy).
  - Admin can read all profiles via /api/admin/doctors/:id.
  - Log all profile changes to an audit_log table.
*/
