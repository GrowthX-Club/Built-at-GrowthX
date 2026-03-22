import { MockRoute, ok } from "./types";

/** Mock user returned for all auth endpoints in mock mode */
export const MOCK_USER = {
  _id: "mock-user-001",
  name: "Demo User",
  initials: "DU",
  avatar: "DU",
  city: "Bangalore",
  rep: 100,
  shipped: 0,
  bio: "Local dev contributor",
  company: "Open Source",
  company_color: "#181710",
  is_membership_active: true,
};

/** bxApi auth routes (/me, /logout) */
export const bxAuthRoutes: MockRoute[] = [
  {
    method: "GET",
    path: "/me",
    description: "Get current authenticated user profile",
    auth: false,
    handler: () => ok({ user: MOCK_USER }),
  },

  {
    method: "POST",
    path: "/logout",
    description: "Clear auth session",
    auth: false,
    handler: () => ok({ success: true }),
  },
];

/** gxApi auth routes (OTP login flow — these go through gxApi, not bxApi) */
export const gxAuthRoutes: MockRoute[] = [
  {
    method: "POST",
    path: "/cauth/send_otp",
    description: "Send OTP to phone number for login",
    auth: false,
    handler: () => ok({ success: true, msg: "OTP sent (mock mode)" }),
  },

  {
    method: "POST",
    path: "/cauth/login",
    description: "Verify OTP and get auth token",
    auth: false,
    handler: () =>
      ok({ success: true, token: "mock-jwt-token", user: MOCK_USER }),
  },

  {
    method: "POST",
    path: "/cauth/register",
    description: "Register new user with phone, name, email",
    auth: false,
    handler: () =>
      ok({ success: true, token: "mock-jwt-token", user: MOCK_USER }),
  },

  {
    method: "POST",
    path: "/cauth/retry_otp",
    description: "Resend OTP",
    auth: false,
    handler: () => ok({ success: true, msg: "OTP resent (mock mode)" }),
  },
];
