"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "@/types";
import { gxApi, setToken } from "@/lib/api";
import { useCaptcha } from "@/hooks/useCaptcha";
import { useLoginDialog } from "@/context/LoginDialogContext";

type Mode = "signin" | "signup";
type Step = "name" | "phone" | "otp";
type CaptchaVersion = "v2" | "v3";

const CAPTCHA_SITE_KEYS = {
  v3: "6LdwUNUlAAAAAB1mZxFvzL7qRyt0LieKgUpzrDKW",
  v2: "6LehQ-snAAAAABH9UY_05XxOOH-cQ8RqrqyJ4bpO",
};

const EMAIL_REGEX = /^([A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/;

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.bg,
  fontSize: 15, color: C.text, fontFamily: "var(--sans)",
  outline: "none",
};

function LoginDialogInner() {
  const { closeLoginDialog, onLoginSuccess } = useLoginDialog();
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
      if (e.key === "Escape") closeLoginDialog();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeLoginDialog]);

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
        padding: 24,
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
        style={{
          position: "relative", width: "100%", maxWidth: 420,
          background: C.surface, borderRadius: 20,
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          animation: "fadeUp 0.25s ease-out",
          padding: "32px 28px",
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
            cursor: "pointer", fontSize: 18, color: C.textMute,
            transition: "all 0.12s", zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
        >
          {"\u00D7"}
        </button>

        {/* Logo + subtitle */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{
            fontSize: 28, fontWeight: 400, fontFamily: "var(--serif)",
            color: C.text, letterSpacing: "-0.02em",
          }}>
            Built <span style={{ fontSize: 14, fontWeight: 400, fontFamily: "var(--sans)", color: C.textMute, letterSpacing: "0" }}>at</span> GrowthX
          </span>
          <p style={{
            fontSize: 14, color: C.textSec, marginTop: 8,
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
            fontSize: 13, color: "#DC2626", marginBottom: 20,
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
                display: "block", fontSize: 13, fontWeight: 550,
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
                display: "block", fontSize: 13, fontWeight: 550,
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
                fontSize: 14, fontWeight: 600,
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
                  fontSize: 13, fontWeight: 500, color: C.textMute,
                  cursor: "pointer", fontFamily: "var(--sans)",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {"\u2190"} Back
              </button>
            )}
            <label style={{
              display: "block", fontSize: 13, fontWeight: 550,
              color: C.text, marginBottom: 8, fontFamily: "var(--sans)",
            }}>
              Phone number
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{
                  width: 80, padding: "12px 8px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.bg,
                  fontSize: 14, color: C.text, fontFamily: "var(--sans)",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+971">+971</option>
                <option value="+65">+65</option>
              </select>
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
                fontSize: 14, fontWeight: 600, cursor: sendDisabled ? "default" : "pointer",
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
                fontSize: 14, color: C.textSec, fontFamily: "var(--sans)",
                fontWeight: 400, lineHeight: 1.5,
              }}>
                Enter the 4-digit code sent to
              </div>
              <div style={{
                fontSize: 15, color: C.text, fontWeight: 600,
                fontFamily: "var(--sans)", marginTop: 4,
              }}>
                {countryCode} {phone}
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setError(""); }}
                  style={{
                    background: "none", border: "none", color: C.accent,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
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
                    fontSize: 22, fontWeight: 600, fontFamily: "var(--sans)",
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
                fontSize: 14, fontWeight: 600,
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
                  fontSize: 13, fontWeight: 500,
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
            <span style={{ fontSize: 13, color: C.textSec, fontFamily: "var(--sans)" }}>
              {mode === "signin" ? "New to GrowthX? " : "Already have an account? "}
            </span>
            <button
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={{
                background: "none", border: "none",
                fontSize: 13, fontWeight: 600, color: C.accent,
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
