import { redirect } from "react-router";

// AI Weekender ran as Build Sprint Season 01; its projects live on the Build Sprint page now.
export const loader = () => redirect("/build-sprint?season=01", 301);

export default function AiWeekenderRedirect() {
  return null;
}
