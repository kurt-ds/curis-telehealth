"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useState } from "react";

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    phone: "",
    acceptTerms: false,
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Backend Implementation
      // 1. Validate file type (JPEG, PNG, WebP)
      // 2. Validate file size (max 5MB)
      // 3. Create FormData and upload to server
      // 4. Compress image on client-side for optimization
      // 5. Store image in cloud storage (AWS S3, Google Cloud Storage, etc.)
      // 6. Generate secure URL with expiration
      // 7. Associate image URL with patient profile
      // 8. Delete old profile picture if exists
      // 9. Log image upload event
      
      // Preview image on client
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
      setProfilePictureFile(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePictureFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Backend Implementation
    // 1. Create API endpoint POST /api/auth/register/patient
    // 2. Validate all input fields (email format, password strength, age requirements)
    // 3. Check if email already exists in database
    // 4. Hash password using bcrypt with appropriate salt rounds
    // 5. Create patient user record with initial profile
    // 6. Generate unique patient ID
    // 7. Send verification email with confirmation link
    // 8. Create patient profile record with initial health data
    // 9. Set up default preferences and notification settings
    // 10. Log user registration event
    // 11. Handle error cases (email exists, weak password, invalid input)
    // 12. Implement CAPTCHA for spam prevention
    
    setTimeout(() => {
      setIsLoading(false);
      alert("Registration functionality coming soon!");
      // In production: send verification email and redirect to email confirmation page
    }, 1500);
  };

  const passwordMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.password && 
    passwordMatch && 
    formData.dateOfBirth &&
    formData.acceptTerms &&
    profilePictureFile;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-md md:max-w-2xl mx-auto px-4 py-16">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 mb-6 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Patient Registration
          </h1>
          <p className="text-slate-600 text-sm">
            Create an account to access your medical records and book appointments.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          
          {/* Profile Picture Upload Section */}
          <div className="mb-8 pb-8 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-800 mb-4">
              Profile Picture <span className="text-red-600">*</span>
            </label>
            
            {/* Upload Area */}
            {!profilePicture ? (
              <div>
                <label className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all duration-200 group">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 mb-1">Upload Photo</span>
                    <span className="text-xs text-slate-500">or drag and drop</span>
                    <span className="text-xs text-slate-400 mt-2">PNG, JPG, WebP (Max 5MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>
            ) : (
              /* Preview Section */
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profilePicture}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {profilePictureFile?.name}
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    {profilePictureFile && `${(profilePictureFile.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeProfilePicture}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors duration-200"
                  disabled={isLoading}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-800 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-800 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-slate-800 mb-2">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-800 mb-2">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* TODO: Backend password strength validation */}
              {/* Implement password requirements:
                  1. Minimum 8 characters
                  2. At least one uppercase letter
                  3. At least one lowercase letter
                  4. At least one number
                  5. At least one special character
                  6. Not a commonly used password
              */}
              <p className="text-xs text-slate-500 mt-1">
                At least 8 characters with mix of uppercase, lowercase, numbers, and symbols
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-800 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-transparent transition-all duration-200 ${
                  formData.confirmPassword && !passwordMatch
                    ? "border-red-300 focus:ring-2 focus:ring-red-500"
                    : "border-slate-200 focus:ring-2 focus:ring-indigo-500"
                }`}
                required
                disabled={isLoading}
              />
              {formData.confirmPassword && !passwordMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Accept Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                  disabled={isLoading}
                />
                <span className="text-xs text-slate-700">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    disabled={isLoading}
                  >
                    Terms of Service
                  </button>
                  {" "}and{" "}
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    disabled={isLoading}
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] mt-6"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-500">or continue with</span>
            </div>
          </div>

          {/* Social Register Buttons - TODO: Backend Implementation */}
          {/* Implement OAuth/SSO registration:
              1. Google OAuth registration
              2. Apple ID registration
              3. Microsoft Account registration
              4. Store OAuth account linking
              5. Auto-fill user data from OAuth provider
              6. Handle existing account with OAuth
          */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-slate-700 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs">Google</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-slate-700 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 13.5c0 2.89-2.15 5.36-4.99 5.36-2.84 0-4.99-2.47-4.99-5.36 0-2.88 2.15-5.36 4.99-5.36 2.84 0 4.99 2.48 4.99 5.36zm-4.99-3.66c-1.82 0-3.3-1.46-3.3-3.27 0-1.81 1.48-3.27 3.3-3.27 1.82 0 3.3 1.46 3.3 3.27 0 1.81-1.48 3.27-3.3 3.27zm8.74-6.68h-4.24V1.08h4.24v2.08zm-4.24 4.44h4.24v14.98h-4.24V7.3zM3.7 8.94c-.16-.34-.24-.72-.24-1.14 0-1.58 1.28-2.86 2.86-2.86 1.58 0 2.86 1.28 2.86 2.86 0 .43-.08.8-.24 1.14-1.01-.81-2.33-1.3-3.78-1.3-1.45 0-2.77.49-3.78 1.3zm0 6.22c-.16-.34-.24-.72-.24-1.14 0-1.58 1.28-2.86 2.86-2.86 1.58 0 2.86 1.28 2.86 2.86 0 .43-.08.8-.24 1.14-1.01-.81-2.33-1.3-3.78-1.3-1.45 0-2.77.49-3.78 1.3z"/>
              </svg>
              <span className="text-xs">Apple</span>
            </button>
          </div>

        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-slate-600 text-sm">
            Already have an account?{" "}
            <Link
              href="/login/patient"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>

      </main>
    </div>
  );
}
