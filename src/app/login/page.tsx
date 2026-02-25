"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginDialog } from "@/context/LoginDialogContext";

export default function LoginPage() {
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();

  useEffect(() => {
    router.replace("/");
    openLoginDialog();
  }, [router, openLoginDialog]);

  return null;
}
