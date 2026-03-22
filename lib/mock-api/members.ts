import { seedBuilders } from "../seed-data";
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/members",
    description: "Builder leaderboard sorted by reputation",
    auth: false,
    handler: () => ok({ members: seedBuilders }),
  },

  {
    method: "GET",
    path: "/users/search",
    description: "Search builders by name. Query: ?q=...",
    auth: false,
    handler: ({ query }) => {
      const q = (query.get("q") || "").toLowerCase();
      const matched = seedBuilders
        .filter((b) => b.name.toLowerCase().includes(q))
        .map((b) => ({
          _id: b._id || b.name,
          name: b.name,
          initials: b.avatar,
        }));
      return ok({ users: matched });
    },
  },
];

export default routes;
