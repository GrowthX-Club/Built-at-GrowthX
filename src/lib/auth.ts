import { Member, ROLE_WEIGHTS } from "@/types";

// Mock auth context for v1
// In production, this would integrate with GrowthX SSO

let currentUser: Member | null = null;

export function setCurrentUser(user: Member | null) {
  currentUser = user;
}

export function getCurrentUser(): Member | null {
  return currentUser;
}

export function getVoteWeight(role: string): number {
  return ROLE_WEIGHTS[role] || 1;
}

export function getHighestRole(roles: string[]): string {
  const priority = ["builder", "host", "founder", "member", "nonmember"];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  return "nonmember";
}
