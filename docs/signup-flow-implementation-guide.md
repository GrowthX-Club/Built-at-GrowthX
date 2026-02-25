# GrowthX Signup Flow - Implementation Guide

This document explains how the GrowthX signup flow works and how to replicate it in another codebase.

---

## Overview

The signup is a **3-step OTP-based flow**:

1. **Step 1** - Collect **Full Name** and **Email**
2. **Step 2** - Collect **Phone Number** and send OTP
3. **Step 3** - Verify **4-digit OTP** and register the user

No passwords are involved. Authentication is entirely phone-OTP-based.

---

## Architecture

```
┌─────────────────┐     ┌───────────────┐     ┌──────────────┐
│  Signup Page     │────▶│  SignupForm    │────▶│  SendOtp     │
│  pages/signup.js │     │  (UI + logic) │     │  (OTP logic) │
└─────────────────┘     └───────────────┘     └──────────────┘
                              │                      │
                              ▼                      ▼
                        ┌───────────┐         ┌─────────────┐
                        │ /cauth/   │         │ /cauth/     │
                        │ register  │         │ send_otp    │
                        └───────────┘         └─────────────┘
```

### Key Files

| Purpose | File |
|---------|------|
| Signup page (entry point) | `pages/signup.js` |
| Main signup form UI | `modules/auth/components/SignupForm.tsx` |
| OTP send/resend logic | `components/signup/SendOtp.tsx` |
| Registration wrapper (render-props) | `components/signup/Registration.tsx` |
| Form state hook | `modules/auth/hooks/useFormState.tsx` |
| Regex validators | `utils/dataTypes/regex.ts` |
| User Redux slice | `redux/user-slice.ts` |

---

## API Endpoints

All endpoints are relative to the backend base URL (e.g., `https://backend.dev.growthx.club/api/v1`).

### 1. Send OTP - `POST /cauth/send_otp`

```json
{
  "phone": "+91.9876543210",
  "token": "<reCAPTCHA_token>",
  "action": "MEMBER_SIGNUP_V3",
  "variant": "v3",
  "provider": "aisensy"        // optional, for WhatsApp OTP
}
```

- `phone` format is always `+{countryCode}.{nationalNumber}` (e.g., `+91.9876543210`)
- `token` comes from Google reCAPTCHA Enterprise
- `action` / `variant` correspond to reCAPTCHA version (`V2` or `V3`)
- `provider: "aisensy"` triggers WhatsApp OTP instead of SMS

### 2. Resend OTP - `POST /cauth/retry_otp`

Same payload as `send_otp`. Has a **60-second cooldown** between resends.

### 3. Register - `POST /cauth/register`

```json
{
  "fname": "John",
  "lname": "Doe",
  "email": "john@example.com",
  "phone": "+91.9876543210",
  "code": "1234",
  "identifier": "phone",
  "source": "community",
  "whatsappOpted": true,
  "ref": "referral_code",
  "tracking_params": {
    "utm_source": "google",
    "utm_campaign": "spring2025",
    "utm_medium": "cpc"
  },
  "application_form_version": "v2.2"
}
```

- `fname` / `lname` are split from the full name (`name.split(' ')`, first token is `fname`, rest is `lname`)
- `code` is the 4-digit OTP the user entered
- `identifier` is always `"phone"`
- `source` is always `"community"`
- `ref` is an optional referral code from URL params

### 4. Login (existing user via OTP) - `POST /cauth/login`

```json
{
  "phone": "+91.9876543210",
  "code": "1234",
  "source": "community"
}
```

### 5. Get User Info - `GET /users/info`

Called after successful registration to fetch the user object and store in Redux.

---

## Validation Rules

```typescript
const regex = {
  email: /^([A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/,
  phone: /^[0-9]{10}$/,
  phoneWithCountryCode: /^\+(\d{1,4})\.(\d+)$/,
  signupOtp: /^[0-9]{4}$/,
};
```

| Field | Rule |
|-------|------|
| Name | Required, no special validation beyond non-empty |
| Email | Must match email regex |
| Phone | Validated with `matchIsValidTel()` from `mui-tel-input` (international format) |
| OTP | Exactly 4 digits |

---

## Step-by-Step Implementation Guide

### Step 1: Form State Management

Create a form state hook that tracks values, errors, and active field:

```typescript
// useFormState.ts
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, boolean>>;
  active: keyof T | null;
}

const useFormState = <T>(initialValues: T) => {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    active: null,
  });

  const handleInputChange = (key: keyof T, value: T[keyof T]) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [key]: value },
      errors: { ...prev.errors, [key]: false },  // clear error on change
    }));
  };

  const handleInputError = (key: keyof T, error: boolean) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [key]: error },
    }));
  };

  return { formState, handleInputChange, handleInputError };
};
```

Initial form values:

```typescript
const initialInputs = {
  phone: '',
  email: '',
  otp: '',
  name: '',
};
```

### Step 2: Build the OTP Logic

The OTP logic is decoupled from the UI using a **render-props** pattern (`SendOtp` component). Here's what it provides:

```typescript
interface SendOtpArgs {
  loading: 'SEND' | 'RESEND' | null;
  isCoolingOffPeriod: boolean;       // true for 60s after resend
  coolingOffPeriod: number;          // seconds remaining
  captchaVersion: string;            // 'v2' or 'v3'
  isOtpSent: boolean;
  sendOtpHandler: (phone: string) => Promise<boolean>;
  resendOtpHandler: (phone: string, isWhatsAppOtp?: boolean) => void;
  disableSendingOtp: boolean;
}
```

**Key behaviors:**
- Starts with reCAPTCHA **v3** (invisible). If the score is too low (`TOKEN_V3_LOW_SCORE`), falls back to **v2** (checkbox).
- 60-second cooldown timer between OTP resends.
- Supports WhatsApp OTP delivery via `provider: "aisensy"`.

### Step 3: Build the Multi-Step Form UI

The form has two visual steps controlled by an enum:

```typescript
enum FormStep {
  NAME = 'NAME',   // Step 1: Name + Email
  PHONE = 'PHONE', // Step 2: Phone → OTP → Submit
}
```

**Step transitions:**
1. User fills name + email → clicks "Continue" → validates email → moves to `PHONE` step
2. User fills phone → clicks "Get OTP" → calls `sendOtpHandler` → shows OTP input
3. User fills OTP → clicks "Enter the club" → calls `handleRegister`

### Step 4: Registration Handler

```typescript
const handleRegister = async () => {
  const nameParts = name.split(' ');

  const payload = {
    fname: nameParts[0],
    lname: nameParts.slice(1).join(' '),
    email,
    phone,                    // "+CC.nationalNumber" format
    code: otp,                // 4-digit OTP
    identifier: 'phone',
    source: 'community',
    whatsappOpted: true,
    ref: queryParams.ref,     // optional referral
    tracking_params: { utm_source, utm_campaign, utm_medium, utm_content },
    application_form_version: 'v2.2',
  };

  // 1. Register user
  await api.post('/cauth/register', payload);

  // 2. Fetch user data
  await dispatch(getUser());

  // 3. Redirect
  if (queryParams.redirect) {
    router.push(queryParams.redirect);
  } else {
    router.push('/application');
  }
};
```

### Step 5: Error Handling

Handle these error codes from the backend:

```typescript
switch (error_code) {
  case 'OTP_NOT_MATCH':
    // Show "Incorrect OTP"
    break;
  case 'OTP_ALREADY_VERIFIED':
    // Show "Please try again", reset OTP input
    break;
  case 'OTP_MAX_RETRIES':
    // Show "Max retries reached. Please try again.", reset OTP input
    break;
  case 'OTP_SERVICE_FAILED':
    // Show "OTP service failed"
    break;
  case 'OTP_NO_FOUND':
    // Show "OTP has expired. Please try again.", reset OTP input
    break;
  case 'TOKEN_V3_LOW_SCORE':
    // Switch reCAPTCHA from v3 to v2 (show checkbox)
    break;
  case 'TOKEN_V2_LOW_SCORE':
    // Reset reCAPTCHA checkbox
    break;
}

if (status_code === 409) {
  // Show "Existing account" - user already registered
}
```

---

## Phone Number Format

The phone number is stored/sent in the format: `+{countryCode}.{nationalNumber}`

Examples:
- India: `+91.9876543210`
- US: `+1.2025551234`

The `MuiTelInput` component provides `countryCallingCode` and `nationalNumber` in its `onChange` callback metadata:

```typescript
onChange={(number, meta) => {
  const formatted = `+${meta.countryCallingCode}.${meta.nationalNumber}`;
  handleInputChange('phone', formatted);
}}
```

---

## reCAPTCHA Integration

- Uses **Google reCAPTCHA Enterprise**
- Script loaded via: `https://www.google.com/recaptcha/enterprise.js?render=SITE_KEY`
- Starts with **v3** (invisible, score-based)
- Falls back to **v2** (checkbox) if v3 score is too low
- The `useCaptcha` hook wraps API calls to inject the token automatically

---

## Post-Signup Redirect Logic

```
Register success
  → Fetch user info (GET /users/info)
  → If ?redirect param exists → go there
  → If ?campaign=playbook → go to /playbook
  → Default → go to /application
```

---

## Minimal Implementation Checklist

To replicate this flow in another codebase, you need:

1. **Form with 3 fields**: name, email, phone (collected across 2 steps)
2. **OTP input**: 4-digit numeric input
3. **Phone input**: International phone input with country selector (default India)
4. **reCAPTCHA Enterprise**: v3 with v2 fallback
5. **3 API integrations**:
   - `POST /cauth/send_otp` - send OTP to phone
   - `POST /cauth/retry_otp` - resend OTP (with 60s cooldown)
   - `POST /cauth/register` - register with name, email, phone, OTP
6. **Error handling** for OTP error codes listed above
7. **Post-registration**: fetch user info and redirect

### Dependencies Used

| Package | Purpose |
|---------|---------|
| `mui-tel-input` | International phone input with validation |
| `@mui/material` | UI components |
| `@mui/lab` (LoadingButton) | Submit button with loading state |
| `@growthx-club/utils` | `sanitizeData`, `useForm`, `CaptchaContainer`, `useTimedState` |
| `next/router` | Routing and query params |
| `redux` / `@reduxjs/toolkit` | State management (user slice) |
