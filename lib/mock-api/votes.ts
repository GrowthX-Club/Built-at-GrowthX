import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "POST",
    path: "/votes",
    description: "Toggle vote on a project (requires auth). Body: { projectId, weight? }",
    auth: true,
    handler: () => ok({ success: true }),
  },
];

export default routes;
