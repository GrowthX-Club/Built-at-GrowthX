import { seedThreads } from "../seed-data";
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/threads",
    description: "List discussion threads on projects",
    auth: false,
    handler: () => ok({ threads: seedThreads }),
  },
];

export default routes;
