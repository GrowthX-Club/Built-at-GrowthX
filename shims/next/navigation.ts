import { useNavigate, useLocation, useParams, useSearchParams } from "react-router";
import { redirect as rrRedirect } from "react-router";

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export { useSearchParams, useParams };

export function redirect(url: string): never {
  throw rrRedirect(url);
}

export function notFound(): never {
  throw new Response("Not Found", { status: 404 });
}
