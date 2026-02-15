import { C, ROLES } from "@/types";

interface AvatarProps {
  initials: string;
  size?: number;
  role?: string;
}

export default function Avatar({ initials, size = 32, role = "builder" }: AvatarProps) {
  const roleInfo = ROLES[role] || ROLES.builder;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${roleInfo.bg}, ${roleInfo.color}20)`,
        border: `2px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 600,
        color: C.textSec,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
