"use client";

import { useState } from "react";

type StudentAvatarProps = {
  fullName: string;
  photoUrl: string | null;
  initials: string;
};

export function StudentAvatar({ fullName, photoUrl, initials }: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  if (!photoUrl || imageError) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-600 bg-slate-950 text-lg font-bold text-emerald-300">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt={`Foto de ${fullName}`}
      className="h-20 w-20 rounded-2xl border border-slate-600 object-cover"
      onError={() => setImageError(true)}
    />
  );
}
