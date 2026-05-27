"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useState } from "react";

const STEPS = [
  { label: "Account", icon: "lock" },
  { label: "Credentials", icon: "badge" },
  { label: "Practice", icon: "clinic" },
  { label: "Confirm", icon: "check" },
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
    done ? "bg-[#007f6e] text-white shadow shadow-teal-200" :
    active ? "bg-[#007f6e] text-white shadow-md shadow-teal-200 ring-4 ring-teal-100" :
    "bg-slate-100 text-slate-400"
  }`;
  return <div className={cls}>{done ? <CheckIcon /> : <span>{idx + 1}</span>}</div>;
}

export default function DoctorRegisterPage() {
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
    // Step 2 – Credentials
    firstName: "", lastName: "", licenseNumber: "", specialty: "",
    // Step 3 – Practice Info
    institution: "", yearsOfExperience: "", phone: "", languages: "", bio: "", consultationFee: "",
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
  const step2Valid = !!(formData.firstName && formData.lastName && formData.licenseNumber && formData.specialty);
  const step3Valid = true; // all optional in step 3

  const handleSubmit = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const body = new FormData();
      body.append("email", formData.email);
      body.append("password", formData.password);
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("specialty", formData.specialty);
      if (formData.licenseNumber)    body.append("licenseNumber", formData.licenseNumber);
      if (formData.institution)      body.append("institution", formData.institution);
      if (formData.yearsOfExperience) body.append("yearsOfExperience", formData.yearsOfExperience);
      if (formData.consultationFee)  body.append("consultationFee", formData.consultationFee);
      if (formData.languages)        body.append("languages", formData.languages);
      if (formData.phone)            body.append("phone", formData.phone);
      if (formData.bio)              body.append("bio", formData.bio);
      if (profilePictureFile)        body.append("avatar", profilePictureFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${API_URL}/api/auth/register/doctor`, {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      localStorage.setItem("curis_token", data.token);
      localStorage.setItem("curis_user", JSON.stringify(data.user));
      localStorage.setItem("curis_doctor", JSON.stringify(data.doctor));

      router.push("/doctor/dashboard");
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white text-sm";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5";

  const SPECIALTIES = [
    "Cardiology","Dermatology","Endocrinology","Gastroenterology","General Practice",
    "Hematology","Internal Medicine","Nephrology","Neurology","Oncology",
    "Ophthalmology","Orthopedics","Pediatrics","Psychiatry","Pulmonology",
    "Radiology","Rheumatology","Surgery","Urology","Other"
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-12">
        <Link href="/register" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Register
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full mb-3">
            <svg className="w-3.5 h-3.5 text-[#007f6e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-xs font-bold text-[#007f6e] tracking-wide">CLINICAL REGISTRATION</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Join our verified specialist network.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div className="flex flex-col items-center gap-1">
                <StepBubble idx={i} current={step} />
                <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:block ${step === i + 1 ? "text-[#007f6e]" : step > i + 1 ? "text-teal-400" : "text-slate-300"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ${step > i + 1 ? "bg-[#007f6e]" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-[#007f6e] to-teal-400 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="p-8">

            {/* STEP 1 – Account */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Account Setup</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Create your secure login credentials.</p>
                </div>

                <div>
                  <label className={lbl}>Profile Photo <span className="text-slate-400 font-normal">(optional)</span></label>
                  {!profilePicture ? (
                    <label className="flex flex-col items-center justify-center w-full px-6 py-6 border-2 border-dashed border-teal-200 rounded-xl cursor-pointer hover:bg-teal-50/50 transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-[#007f6e] mb-2 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-semibold text-teal-700">Upload Photo</span>
                      <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP · Max 5MB</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50">
                      <img src={profilePicture} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-teal-200" />
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
                  <input id="email" name="email" type="email" placeholder="doctor@clinic.com" value={formData.email} onChange={handleChange} className={inp} required />
                </div>

                <div>
                  <label htmlFor="password" className={lbl}>Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className={inp} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors">
                      {showPassword
                        ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Min. 8 chars · uppercase · number · symbol</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={lbl}>Confirm Password <span className="text-red-500">*</span></label>
                  <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                    className={`${inp} ${formData.confirmPassword && !passwordMatch ? "border-red-300 focus:ring-red-400" : ""}`} required />
                  {formData.confirmPassword && !passwordMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 – Credentials */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Medical Credentials</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your license will be verified by our credentialing team.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className={lbl}>First Name <span className="text-red-500">*</span></label>
                    <input id="firstName" name="firstName" type="text" placeholder="John" value={formData.firstName} onChange={handleChange} className={inp} required />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={lbl}>Last Name <span className="text-red-500">*</span></label>
                    <input id="lastName" name="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={handleChange} className={inp} required />
                  </div>
                </div>

                <div>
                  <label htmlFor="licenseNumber" className={lbl}>Medical License Number <span className="text-red-500">*</span></label>
                  <input id="licenseNumber" name="licenseNumber" type="text" placeholder="MD-12345678" value={formData.licenseNumber} onChange={handleChange} className={inp} required />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <svg className="w-3 h-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p className="text-xs text-slate-400">Verified against medical board records</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="specialty" className={lbl}>Medical Specialty <span className="text-red-500">*</span></label>
                  <select id="specialty" name="specialty" value={formData.specialty} onChange={handleChange} className={inp} required>
                    <option value="">Select a specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s.toLowerCase().replace(/ /g, "_")}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3 – Practice Info */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Practice Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Help patients find and understand your practice.</p>
                </div>

                <div>
                  <label htmlFor="institution" className={lbl}>Hospital / Institution</label>
                  <input id="institution" name="institution" type="text" placeholder="General Hospital" value={formData.institution} onChange={handleChange} className={inp} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="yearsOfExperience" className={lbl}>Years of Experience</label>
                    <input id="yearsOfExperience" name="yearsOfExperience" type="number" placeholder="10" min="0" max="60" value={formData.yearsOfExperience} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label htmlFor="consultationFee" className={lbl}>Consultation Fee ($)</label>
                    <input id="consultationFee" name="consultationFee" type="number" placeholder="150" min="0" value={formData.consultationFee} onChange={handleChange} className={inp} />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={lbl}>Office Phone</label>
                  <input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} className={inp} />
                </div>

                <div>
                  <label htmlFor="languages" className={lbl}>Languages Spoken</label>
                  <input id="languages" name="languages" type="text" placeholder="English, Spanish" value={formData.languages} onChange={handleChange} className={inp} />
                </div>

                <div>
                  <label htmlFor="bio" className={lbl}>Professional Bio</label>
                  <textarea id="bio" name="bio" placeholder="Brief summary of your expertise, approach, and specializations..." value={formData.bio} onChange={handleChange} rows={3} className={`${inp} resize-none`} />
                </div>
              </div>
            )}

            {/* STEP 4 – Confirm */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-slate-800">Review & Submit</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Confirm your details and submit for verification.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-teal-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-[#007f6e] text-lg font-black">
                        {formData.firstName ? formData.firstName[0].toUpperCase() : "D"}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Dr. {formData.firstName} {formData.lastName}</p>
                      <p className="text-xs text-slate-500">{formData.email}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-[#007f6e] uppercase">Doctor</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {[
                      { label: "License", val: formData.licenseNumber || "—" },
                      { label: "Specialty", val: formData.specialty || "—" },
                      { label: "Institution", val: formData.institution || "—" },
                      { label: "Experience", val: formData.yearsOfExperience ? `${formData.yearsOfExperience} yrs` : "—" },
                      { label: "Languages", val: formData.languages || "—" },
                      { label: "Fee", val: formData.consultationFee ? `$${formData.consultationFee}` : "—" },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{label}</p>
                        <p className="text-slate-700 font-medium mt-0.5">{val}</p>
                      </div>
                    ))}
                    {formData.bio && (
                      <div className="col-span-2">
                        <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Bio</p>
                        <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{formData.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-amber-700">Your medical license will be verified within 1–2 business days. You'll receive an email once your account is approved.</p>
                </div>

                {apiError && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-red-700 font-medium">{apiError}</p>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setFormData(p => ({ ...p, acceptTerms: !p.acceptTerms }))}
                    className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${formData.acceptTerms ? "bg-[#007f6e] border-[#007f6e]" : "border-slate-300 group-hover:border-teal-400"}`}
                  >
                    {formData.acceptTerms && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <button type="button" className="text-[#007f6e] hover:text-[#006d5b] font-semibold">Terms of Service</button>
                    {" "}and{" "}
                    <button type="button" className="text-[#007f6e] hover:text-[#006d5b] font-semibold">Privacy Policy</button>
                    . I certify that all information provided is accurate and my medical credentials are valid.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className={`flex mt-8 gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#007f6e] hover:bg-[#006d5b] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] ml-auto">
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isLoading || !formData.acceptTerms}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#007f6e] hover:bg-[#006d5b] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 active:scale-[0.98] ml-auto">
                  {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isLoading ? "Submitting..." : "Submit for Verification"}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already registered?{" "}
          <Link href="/login/doctor" className="text-[#007f6e] hover:text-[#006d5b] font-semibold">Sign in here</Link>
        </p>
      </main>
    </div>
  );
}
