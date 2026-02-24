"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/types";
import { gxApi } from "@/lib/api";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const fullPhone = `${countryCode}.${phone.replace(/\D/g, "")}`;

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await gxApi("/cauth/send_mobile_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setError("");
    try {
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
        setError(data.message || "Invalid OTP");
        setOtp(["", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }
      // Login successful — cookies are set by gx-backend
      router.push("/");
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const code = next.join("");
      if (code.length === 4) {
        handleVerifyOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) handleVerifyOtp(code);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    if (pasted.length === 4) {
      handleVerifyOtp(pasted);
    } else {
      otpRefs.current[pasted.length]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await gxApi("/cauth/retry_mobile_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to resend OTP");
        return;
      }
      setResendTimer(30);
      setOtp(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--sans)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{
            fontSize: 28, fontWeight: 400, fontFamily: "var(--serif)",
            color: C.text, letterSpacing: "-0.02em",
          }}>
            Built
          </span>
          <p style={{
            fontSize: 14, color: C.textSec, marginTop: 8,
            fontFamily: "var(--sans)", fontWeight: 400,
          }}>
            Sign in to your GrowthX account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "32px 28px",
        }}>
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

          {step === "phone" && (
            <>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 550,
                color: C.text, marginBottom: 8, fontFamily: "var(--sans)",
              }}>
                Phone number
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
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
                  onKeyDown={e => { if (e.key === "Enter") handleSendOtp(); }}
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.bg,
                    fontSize: 15, color: C.text, fontFamily: "var(--sans)",
                    outline: "none", letterSpacing: "0.02em",
                  }}
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px 20px", borderRadius: 10,
                  border: "none", background: C.accent, color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer",
                  fontFamily: "var(--sans)", opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

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
                {loading ? "Verifying..." : "Verify & Sign in"}
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
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none", border: "none", fontSize: 13,
              color: C.textMute, cursor: "pointer", fontFamily: "var(--sans)",
              fontWeight: 450, transition: "color 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textMute}
          >
            Back to Built
          </button>
        </div>
      </div>
    </div>
  );
}
