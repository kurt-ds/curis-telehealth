"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useState } from "react";

const STEPS = [
  { label: "Account" },
  { label: "Personal" },
  { label: "Health" },
  { label: "Confirm" },
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StepBubble({ idx, current }: { idx: number; current: number }) {
  const done = current > idx + 1;
  const active = current === idx + 1;
  const cls = `w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
    done ? "bg-indigo-600 text-white shadow shadow-indigo-200" :
    active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-100" :
    "bg-slate-100 text-slate-400"
  }`;
  return <div className={cls}>{done ? <CheckIcon /> : <span>{idx + 1}</span>}</div>;
}

export default function PatientRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Step 1
    email: "", password: "", confirmPassword: "",
    // Step 2
    firstName: "", lastName: "", dateOfBirth: "", gender: "",
    phone: "", address: "",
    // Step 3 – Health
    bloodType: "", height: "", weight: "",
    allergies: "", medicalHistory: "",
    emergencyContact: "", emergencyPhone: "",
    // Step 4
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(file);
      setProfilePictureFile(file);
    }
  };

  const passwordMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
  const step1Valid = !!(formData.email && formData.password && passwordMatch);
  const step2Valid = !!(formData.firstName && formData.lastName && formData.dateOfBirth);
  // step 3 is all optional

  const handleSubmit = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const body = new FormData();
      // Core fields
      body.append("email", formData.email);
      body.append("password", formData.password);
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      // Optional fields — only append if filled
      if (formData.dateOfBirth) body.append("dateOfBirth", formData.dateOfBirth);
      if (formData.gender)      body.append("gender", formData.gender);
      if (formData.phone)       body.append("phone", formData.phone);
      if (formData.address)     body.append("address", formData.address);
      if (formData.bloodType)   body.append("bloodType", formData.bloodType);
      if (formData.height)      body.append("height", formData.height);
      if (formData.weight)      body.append("weight", formData.weight);
      if (formData.allergies)   body.append("allergies", formData.allergies);
      if (formData.medicalHistory) body.append("medicalHistory", formData.medicalHistory);
      if (formData.emergencyContact) body.append("emergencyContact", formData.emergencyContact);
      if (formData.emergencyPhone)   body.append("emergencyPhone", formData.emergencyPhone);
      // Avatar file
      if (profilePictureFile) body.append("avatar", profilePictureFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${API_URL}/api/auth/register/patient`, {
        method: "POST",
        body, // multipart/form-data — do NOT set Content-Type header manually
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // Persist token
      localStorage.setItem("curis_token", data.token);
      localStorage.setItem("curis_user", JSON.stringify(data.user));
      localStorage.setItem("curis_patient", JSON.stringify(data.patient));

      router.push("/patient/dashboard");
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-sm";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5";

  const EyeOn = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const EyeOff = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
  const ChevronR = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
  const ChevronL = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-12">
        <Link href="/register" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 text-sm font-medium">
          <ChevronL /> Back to Register
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Create your account to access telehealth services.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div className="flex flex-col items-center gap-1">
                <StepBubble idx={i} current={step} />
                <span className={`text-[10px] font-bold tracking-wider uppercase ${step === i+1 ? "text-indigo-600" : step > i+1 ? "text-indigo-400" : "text-slate-300"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ${step > i+1 ? "bg-indigo-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="p-8">

            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Account Setup</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose your login credentials.</p>
                </div>

                {/* Photo */}
                <div>
                  <label className={lbl}>Profile Photo <span className="text-slate-400 font-normal">(optional)</span></label>
                  {!profilePicture ? (
                    <label className="flex flex-col items-center justify-center w-full px-6 py-6 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-2 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">Upload Photo</span>
                      <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP · Max 5MB</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50">
                      <img src={profilePicture} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{profilePictureFile?.name}</p>
                        <p className="text-xs text-slate-400">{profilePictureFile && `${(profilePictureFile.size / 1024).toFixed(1)} KB`}</p>
                      </div>
                      <button type="button" onClick={() => { setProfilePicture(null); setProfilePictureFile(null); }} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className={lbl}>Email Address <span className="text-red-500">*</span></label>
                  <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className={inp} />
                </div>

                <div>
                  <label htmlFor="password" className={lbl}>Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className={inp} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOn /> : <EyeOff />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Min. 8 chars · uppercase · number · symbol</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={lbl}>Confirm Password <span className="text-red-500">*</span></label>
                  <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                    className={`${inp} ${formData.confirmPassword && !passwordMatch ? "border-red-300 focus:ring-red-400" : ""}`} />
                  {formData.confirmPassword && !passwordMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>
              </div>
            )}

            {/* ── STEP 2: Personal Info ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Personal Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Basic details to set up your patient profile.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className={lbl}>First Name <span className="text-red-500">*</span></label>
                    <input id="firstName" name="firstName" type="text" placeholder="John" value={formData.firstName} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={lbl}>Last Name <span className="text-red-500">*</span></label>
                    <input id="lastName" name="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={handleChange} className={inp} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="dateOfBirth" className={lbl}>Date of Birth <span className="text-red-500">*</span></label>
                    <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label htmlFor="gender" className={lbl}>Gender</label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inp}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={lbl}>Phone Number</label>
                  <input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} className={inp} />
                </div>

                <div>
                  <label htmlFor="address" className={lbl}>Home Address</label>
                  <textarea id="address" name="address" placeholder="123 Main St, City, State, ZIP" value={formData.address} onChange={handleChange} rows={2} className={`${inp} resize-none`} />
                </div>
              </div>
            )}

            {/* ── STEP 3: Health Profile ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Health Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Optional but helps your doctor provide better care. You can update this anytime.</p>
                </div>

                {/* Vitals */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vitals</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="bloodType" className={lbl}>Blood Type</label>
                      <select id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} className={inp}>
                        <option value="">—</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="height" className={lbl}>Height (cm)</label>
                      <input id="height" name="height" type="number" placeholder="170" min="50" max="300" value={formData.height} onChange={handleChange} className={inp} />
                    </div>
                    <div>
                      <label htmlFor="weight" className={lbl}>Weight (kg)</label>
                      <input id="weight" name="weight" type="number" placeholder="70" min="1" max="500" value={formData.weight} onChange={handleChange} className={inp} />
                    </div>
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Medical Background</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="allergies" className={lbl}>Known Allergies</label>
                      <textarea
                        id="allergies" name="allergies"
                        placeholder="e.g. Penicillin (severe), Peanuts (moderate), Latex (mild)…"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows={2}
                        className={`${inp} resize-none`}
                      />
                      <p className="text-xs text-slate-400 mt-1">List allergens and severity. Leave blank if none known.</p>
                    </div>

                    <div>
                      <label htmlFor="medicalHistory" className={lbl}>Medical History</label>
                      <textarea
                        id="medicalHistory" name="medicalHistory"
                        placeholder="e.g. Type 2 Diabetes (2018), Hypertension, Appendectomy (2015)…"
                        value={formData.medicalHistory}
                        onChange={handleChange}
                        rows={3}
                        className={`${inp} resize-none`}
                      />
                      <p className="text-xs text-slate-400 mt-1">Include past diagnoses, surgeries, or ongoing conditions.</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="emergencyContact" className={lbl}>Contact Name</label>
                      <input id="emergencyContact" name="emergencyContact" type="text" placeholder="Jane Doe" value={formData.emergencyContact} onChange={handleChange} className={inp} />
                    </div>
                    <div>
                      <label htmlFor="emergencyPhone" className={lbl}>Contact Phone</label>
                      <input id="emergencyPhone" name="emergencyPhone" type="tel" placeholder="+1 (555) 000-0000" value={formData.emergencyPhone} onChange={handleChange} className={inp} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-indigo-700">All health data is encrypted and only shared with your treating physicians. You can edit this anytime from your Profile.</p>
                </div>
              </div>
            )}

            {/* ── STEP 4: Confirm ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Review & Confirm</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verify your details before creating your account.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-black">
                        {formData.firstName ? formData.firstName[0].toUpperCase() : "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{formData.firstName} {formData.lastName}</p>
                      <p className="text-xs text-slate-500">{formData.email}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase">Patient</span>
                  </div>

                  {/* Personal */}
                  <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {[
                      { label: "Date of Birth", val: formData.dateOfBirth || "—" },
                      { label: "Gender", val: formData.gender || "—" },
                      { label: "Phone", val: formData.phone || "—" },
                      { label: "Blood Type", val: formData.bloodType || "—" },
                      { label: "Height", val: formData.height ? `${formData.height} cm` : "—" },
                      { label: "Weight", val: formData.weight ? `${formData.weight} kg` : "—" },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{label}</p>
                        <p className="text-slate-700 font-medium mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Health summary */}
                  {(formData.allergies || formData.medicalHistory) && (
                    <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                      {formData.allergies && (
                        <div>
                          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Allergies</p>
                          <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{formData.allergies}</p>
                        </div>
                      )}
                      {formData.medicalHistory && (
                        <div>
                          <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Medical History</p>
                          <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{formData.medicalHistory}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emergency */}
                  {formData.emergencyContact && (
                    <div className="border-t border-slate-200 pt-3 text-xs">
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Emergency Contact</p>
                      <p className="text-slate-700 font-medium mt-0.5">{formData.emergencyContact} {formData.emergencyPhone && `· ${formData.emergencyPhone}`}</p>
                    </div>
                  )}
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-red-700 font-medium">{apiError}</p>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setFormData(p => ({ ...p, acceptTerms: !p.acceptTerms }))}
                    className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${formData.acceptTerms ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}`}
                  >
                    {formData.acceptTerms && <CheckIcon />}
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <button type="button" className="text-indigo-600 hover:text-indigo-700 font-semibold">Terms of Service</button>
                    {" "}and{" "}
                    <button type="button" className="text-indigo-600 hover:text-indigo-700 font-semibold">Privacy Policy</button>
                    . I consent to Curis Telehealth processing my health data.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className={`flex mt-8 gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all duration-200">
                  <ChevronL /> Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] ml-auto">
                  Continue <ChevronR />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isLoading || !formData.acceptTerms}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 active:scale-[0.98] ml-auto">
                  {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login/patient" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in here</Link>
        </p>
      </main>
    </div>
  );
}
