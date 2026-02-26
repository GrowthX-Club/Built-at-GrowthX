"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { C, T } from "@/types";
import { gxApi, setToken } from "@/lib/api";
import { useCaptcha } from "@/hooks/useCaptcha";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import BuiltLogo from "./BuiltLogo";

type Mode = "signin" | "signup";
type Step = "name" | "phone" | "otp";
type CaptchaVersion = "v2" | "v3";

const COUNTRIES = [
  { code: "+91", iso: "IN", flag: "🇮🇳", name: "India" },
  { code: "+1", iso: "US", flag: "🇺🇸", name: "United States" },
  { code: "+44", iso: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+971", iso: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+65", iso: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", iso: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+49", iso: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+33", iso: "FR", flag: "🇫🇷", name: "France" },
  { code: "+81", iso: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+86", iso: "CN", flag: "🇨🇳", name: "China" },
  { code: "+966", iso: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", iso: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "+60", iso: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "+62", iso: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "+63", iso: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "+234", iso: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", iso: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "+27", iso: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+55", iso: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", iso: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+82", iso: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+7", iso: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "+39", iso: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+34", iso: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+31", iso: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", iso: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+41", iso: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+353", iso: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+972", iso: "IL", flag: "🇮🇱", name: "Israel" },
  { code: "+90", iso: "TR", flag: "🇹🇷", name: "Turkey" },
  { code: "+48", iso: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+47", iso: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "+45", iso: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "+64", iso: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+94", iso: "LK", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", iso: "NP", flag: "🇳🇵", name: "Nepal" },
  { code: "+880", iso: "BD", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+92", iso: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "+66", iso: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", iso: "VN", flag: "🇻🇳", name: "Vietnam" },
];

const CAPTCHA_SITE_KEYS = {
  v3: "6LdwUNUlAAAAAB1mZxFvzL7qRyt0LieKgUpzrDKW",
  v2: "6LehQ-snAAAAABH9UY_05XxOOH-cQ8RqrqyJ4bpO",
};

const EMAIL_REGEX = /^([A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/;

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.bg,
  fontSize: T.body, color: C.text, fontFamily: "var(--sans)",
  outline: "none",
};

function LoginDialogInner() {
  const { closeLoginDialog, onLoginSuccess } = useLoginDialog();
  const { isMobile } = useResponsive();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("phone");
  // Shared fields
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [captchaVersion, setCaptchaVersion] = useState<CaptchaVersion>("v3");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [ccOpen, setCcOpen] = useState(false);
  const [ccSearch, setCcSearch] = useState("");
  const ccRef = useRef<HTMLDivElement>(null);
  const ccSearchRef = useRef<HTMLInputElement>(null);
  // Signup-only fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const captchaAction = mode === "signin"
    ? `MEMBER_LOGIN_${captchaVersion.toUpperCase()}`
    : `MEMBER_SIGNUP_${captchaVersion.toUpperCase()}`;

  const { withCaptcha, enableCallback, resetCaptcha } = useCaptcha({
    action: captchaAction,
    version: captchaVersion,
    siteKeys: CAPTCHA_SITE_KEYS,
  });

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (ccOpen) setCcOpen(false);
        else closeLoginDialog();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeLoginDialog, ccOpen]);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!ccOpen) return;
    const handler = (e: MouseEvent) => {
      if (ccRef.current && !ccRef.current.contains(e.target as Node)) setCcOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ccOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (ccOpen) setTimeout(() => ccSearchRef.current?.focus(), 0);
  }, [ccOpen]);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const filteredCountries = ccSearch
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(ccSearch.toLowerCase()) ||
        c.code.includes(ccSearch) ||
        c.iso.toLowerCase().includes(ccSearch.toLowerCase())
      )
    : COUNTRIES;

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStep(newMode === "signup" ? "name" : "phone");
    setError("");
    setOtp(["", "", "", ""]);
    setResendTimer(0);
  };

  const fullPhone = `${countryCode}.${phone.replace(/\D/g, "")}`;

  // ---- Name + Email step (signup only) ----

  const handleNameContinue = () => {
    if (!fullName.trim()) { setError("Please enter your full name"); return; }
    if (fullName.trim().split(/\s+/).length < 2) { setError("Please enter your first and last name"); return; }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) { setError("Please enter a valid email address"); return; }
    setError("");
    setStep("phone");
  };

  // ---- Send OTP (shared) ----

  const handleSendOtp = withCaptcha(async (captcha: { token: string; action: string }) => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await gxApi("/cauth/send_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          token: captcha.token,
          action: captcha.action,
          variant: captchaVersion,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error_code === "TOKEN_V3_LOW_SCORE") {
          setCaptchaVersion("v2");
          setError("Please complete the verification below");
          return;
        }
        if (data.error_code === "TOKEN_V2_LOW_SCORE") {
          resetCaptcha();
          setError("Verification failed, please try again");
          return;
        }
        setError(data.message || "Failed to send OTP");
        return;
      }
      setStep("otp");
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  });

  // ---- Verify OTP / Register ----

  const handleVerifyOtp = useCallback(async (code: string) => {
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        // Login
        const res = await gxApi("/cauth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: fullPhone,
            code,
            source: "community",
            password_login: false,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          handleOtpError(data);
          return;
        }
        if (data.token) setToken(data.token);
        onLoginSuccess();
      } else {
        // Register
        const nameParts = fullName.trim().split(" ");
        const fname = nameParts[0];
        const lname = nameParts.slice(1).join(" ");
        const res = await gxApi("/cauth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fname,
            lname,
            email: email.trim(),
            phone: fullPhone,
            code,
            identifier: "phone",
            source: "community",
            whatsappOpted: true,
            application_form_version: "v2.2",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 409) {
            setError("An account with this phone number already exists. Try signing in instead.");
            setOtp(["", "", "", ""]);
            otpRefs.current[0]?.focus();
            return;
          }
          handleOtpError(data);
          return;
        }
        if (data.token) setToken(data.token);
        onLoginSuccess();
      }
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }, [mode, fullPhone, fullName, email, onLoginSuccess]);

  const handleOtpError = (data: Record<string, unknown>) => {
    const code = data.error_code as string | undefined;
    let msg = (data.message as string) || "Invalid OTP";
    if (code === "OTP_NOT_MATCH") msg = "Incorrect OTP. Please try again.";
    else if (code === "OTP_ALREADY_VERIFIED") msg = "OTP already used. Please request a new one.";
    else if (code === "OTP_MAX_RETRIES") msg = "Too many attempts. Please request a new OTP.";
    else if (code === "OTP_SERVICE_FAILED") msg = "OTP service failed. Please try again.";
    else if (code === "OTP_NO_FOUND") msg = "OTP has expired. Please request a new one.";
    setError(msg);
    setOtp(["", "", "", ""]);
    otpRefs.current[0]?.focus();
  };

  // ---- OTP input handlers ----

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
    if (value && index === 3) {
      const code = next.join("");
      if (code.length === 4) handleVerifyOtp(code);
    }
  }, [otp, handleVerifyOtp]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) handleVerifyOtp(code);
    }
  }, [otp, handleVerifyOtp]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    if (pasted.length === 4) handleVerifyOtp(pasted);
    else otpRefs.current[pasted.length]?.focus();
  }, [handleVerifyOtp]);

  // ---- Resend OTP ----

  const handleResend = withCaptcha(async (captcha: { token: string; action: string }) => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await gxApi("/cauth/retry_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          token: captcha.token,
          action: captcha.action,
          variant: captchaVersion,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error_code === "TOKEN_V3_LOW_SCORE") {
          setCaptchaVersion("v2");
          setError("Please complete the verification below");
          return;
        }
        if (data.error_code === "TOKEN_V2_LOW_SCORE") {
          resetCaptcha();
          setError("Verification failed, please try again");
          return;
        }
        setError(data.message || "Failed to resend OTP");
        return;
      }
      setResendTimer(mode === "signup" ? 60 : 30);
      setOtp(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  });

  const sendDisabled = loading || !enableCallback;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeLoginDialog}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Card */}
      <div
        className="responsive-modal"
        style={{
          position: "relative", width: "100%", maxWidth: 420,
          background: C.surface, borderRadius: isMobile ? "16px 16px 0 0" : 20,
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          animation: "fadeUp 0.25s ease-out",
          padding: "32px 28px",
          alignSelf: isMobile ? "flex-end" : undefined,
        }}
      >
        {/* Close button */}
        <button
          onClick={closeLoginDialog}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 32,
            border: `1px solid ${C.borderLight}`, background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: T.subtitle, color: C.textMute,
            transition: "all 0.12s", zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
        >
          {"\u00D7"}
        </button>

        {/* Logo + subtitle */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <BuiltLogo height={48} style={{ margin: "0 auto" }} />
          <p style={{
            fontSize: T.body, color: C.textSec, marginTop: 8,
            fontFamily: "var(--sans)", fontWeight: 400,
          }}>
            {mode === "signin"
              ? "Sign in to your GrowthX account"
              : step === "name"
                ? "Create your GrowthX account"
                : step === "phone"
                  ? "Verify your phone number"
                  : "Enter the verification code"
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 10, padding: "10px 14px",
            fontSize: T.bodySm, color: "#DC2626", marginBottom: 20,
            fontFamily: "var(--sans)", fontWeight: 450,
          }}>
            {error}
          </div>
        )}

        {/* ======== SIGNUP: Name + Email step ======== */}
        {mode === "signup" && step === "name" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: T.bodySm, fontWeight: 550,
                color: C.text, marginBottom: 8, fontFamily: "var(--sans)",
              }}>
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleNameContinue(); }}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: T.bodySm, fontWeight: 550,
                color: C.text, marginBottom: 8, fontFamily: "var(--sans)",
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                onKeyDown={e => { if (e.key === "Enter") handleNameContinue(); }}
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleNameContinue}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 10,
                border: "none", background: C.accent, color: "#fff",
                fontSize: T.body, fontWeight: 600,
                cursor: (!fullName.trim() || !email.trim()) ? "default" : "pointer",
                fontFamily: "var(--sans)",
                opacity: (!fullName.trim() || !email.trim()) ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Continue
            </button>
          </>
        )}

        {/* ======== Phone step (shared) ======== */}
        {step === "phone" && !(mode === "signup" && step !== "phone") && (
          <>
            {mode === "signup" && (
              <button
                onClick={() => { setStep("name"); setError(""); }}
                style={{
                  background: "none", border: "none", padding: 0, marginBottom: 16,
                  fontSize: T.bodySm, fontWeight: 500, color: C.textMute,
                  cursor: "pointer", fontFamily: "var(--sans)",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {"\u2190"} Back
              </button>
            )}
            <label style={{
              display: "block", fontSize: T.bodySm, fontWeight: 550,
              color: C.text, marginBottom: 8, fontFamily: "var(--sans)",
            }}>
              Phone number
            </label>
            <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
              <div ref={ccRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => { setCcOpen(!ccOpen); setCcSearch(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "12px 10px 12px 14px", borderRadius: "10px 0 0 10px",
                    border: `1px solid ${C.border}`, borderRight: "none",
                    background: C.bg, fontSize: T.body, color: C.text,
                    fontFamily: "var(--sans)", cursor: "pointer",
                    height: "100%", whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: T.subtitle, lineHeight: 1 }}>{selectedCountry.flag}</span>
                  <span style={{ fontSize: T.body, fontWeight: 450 }}>{selectedCountry.code}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: 2, flexShrink: 0, transition: "transform 0.15s", transform: ccOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    <path d="M1 1L5 5L9 1" stroke={C.textMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {ccOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    width: 260, maxHeight: 280,
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    zIndex: 10, overflow: "hidden",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ padding: "8px 8px 4px" }}>
                      <input
                        ref={ccSearchRef}
                        type="text"
                        value={ccSearch}
                        onChange={e => setCcSearch(e.target.value)}
                        placeholder="Search country..."
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          border: `1px solid ${C.borderLight}`, background: C.bg,
                          fontSize: T.bodySm, color: C.text, fontFamily: "var(--sans)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      {filteredCountries.map(c => (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => { setCountryCode(c.code); setCcOpen(false); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 12px", border: "none",
                            background: c.code === countryCode ? C.bg : "transparent",
                            cursor: "pointer", fontSize: T.body, color: C.text,
                            fontFamily: "var(--sans)", textAlign: "left",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (c.code !== countryCode) e.currentTarget.style.background = C.bg; }}
                          onMouseLeave={e => { if (c.code !== countryCode) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: T.subtitle, lineHeight: 1 }}>{c.flag}</span>
                          <span style={{ flex: 1, fontWeight: 400 }}>{c.name}</span>
                          <span style={{ fontSize: T.bodySm, color: C.textMute, fontWeight: 450 }}>{c.code}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div style={{ padding: "12px 16px", fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)" }}>
                          No results
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && !sendDisabled) handleSendOtp(); }}
                style={{
                  ...inputStyle, flex: 1, width: "auto",
                  letterSpacing: "0.02em",
                  borderRadius: "0 10px 10px 0",
                }}
              />
            </div>

            {/* reCAPTCHA v2 checkbox container */}
            {captchaVersion === "v2" && (
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
                <div id="grecaptcha-checkbox" />
              </div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={sendDisabled}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 10,
                border: "none", background: C.accent, color: "#fff",
                fontSize: T.body, fontWeight: 600, cursor: sendDisabled ? "default" : "pointer",
                fontFamily: "var(--sans)", opacity: sendDisabled ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* ======== OTP step (shared) ======== */}
        {step === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
                fontWeight: 400, lineHeight: 1.5,
              }}>
                Enter the 4-digit code sent to
              </div>
              <div style={{
                fontSize: T.body, color: C.text, fontWeight: 600,
                fontFamily: "var(--sans)", marginTop: 4,
              }}>
                {countryCode} {phone}
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setError(""); }}
                  style={{
                    background: "none", border: "none", color: C.accent,
                    fontSize: T.label, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--sans)", marginLeft: 8,
                  }}
                >
                  Change
                </button>
              </div>
            </div>

            {/* OTP inputs */}
            <div style={{
              display: "flex", gap: 12, justifyContent: "center", marginBottom: 24,
            }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: 52, height: 56, textAlign: "center",
                    fontSize: T.logo, fontWeight: 600, fontFamily: "var(--sans)",
                    borderRadius: 12, border: `1.5px solid ${digit ? C.accent : C.border}`,
                    background: C.bg, color: C.text, outline: "none",
                    transition: "border-color 0.15s",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => { const code = otp.join(""); if (code.length === 4) handleVerifyOtp(code); }}
              disabled={loading || otp.join("").length < 4}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 10,
                border: "none", background: C.accent, color: "#fff",
                fontSize: T.body, fontWeight: 600,
                cursor: (loading || otp.join("").length < 4) ? "default" : "pointer",
                fontFamily: "var(--sans)",
                opacity: (loading || otp.join("").length < 4) ? 0.5 : 1,
                transition: "opacity 0.15s",
                marginBottom: 16,
              }}
            >
              {loading
                ? "Verifying..."
                : mode === "signin" ? "Verify & Sign in" : "Verify & Create account"
              }
            </button>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                style={{
                  background: "none", border: "none",
                  fontSize: T.bodySm, fontWeight: 500,
                  color: resendTimer > 0 ? C.textMute : C.accent,
                  cursor: resendTimer > 0 ? "default" : "pointer",
                  fontFamily: "var(--sans)",
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </>
        )}

        {/* ======== Mode toggle ======== */}
        {step !== "otp" && (
          <div style={{
            textAlign: "center", marginTop: 24,
            paddingTop: 20, borderTop: `1px solid ${C.borderLight}`,
          }}>
            <span style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)" }}>
              {mode === "signin" ? "New to GrowthX? " : "Already have an account? "}
            </span>
            <button
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={{
                background: "none", border: "none",
                fontSize: T.bodySm, fontWeight: 600, color: C.accent,
                cursor: "pointer", fontFamily: "var(--sans)",
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginDialog() {
  const { isOpen } = useLoginDialog();
  if (!isOpen) return null;
  return <LoginDialogInner />;
}
