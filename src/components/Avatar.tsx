interface AvatarProps {
  name: string;
  avatar?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
};

const colors = [
  "bg-orange-100 text-orange",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-blue-100 text-blue-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, avatar, size = "sm" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center font-medium ring-2 ring-white shrink-0`}
    >
      {initials}
    </div>
  );
}
