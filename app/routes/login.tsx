import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useLoginDialog } from "@/context/LoginDialogContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { openLoginDialog } = useLoginDialog();

  useEffect(() => {
    navigate("/", { replace: true });
    openLoginDialog();
  }, [navigate, openLoginDialog]);

  return null;
}
