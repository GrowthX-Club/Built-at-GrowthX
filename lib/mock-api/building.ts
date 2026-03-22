import { seedBuilding } from "../seed-data";
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/building",
    description: "List in-progress projects (idea/prototyping/beta)",
    auth: false,
    handler: () => ok({ buildings: seedBuilding }),
  },
];

export default routes;
