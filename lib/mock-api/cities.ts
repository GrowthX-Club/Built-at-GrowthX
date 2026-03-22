import { seedCities } from "../seed-data";
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/cities",
    description: "City-level stats (builders, shipped, trends)",
    auth: false,
    handler: () => ok({ cities: seedCities }),
  },
];

export default routes;
