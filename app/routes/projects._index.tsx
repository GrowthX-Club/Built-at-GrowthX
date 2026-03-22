import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  return redirect("/");
}

export default function ProjectsRedirect() {
  return null;
}
