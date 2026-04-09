import { seedProjects } from "../seed-data";
import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/projects",
    description: "List projects with sorting and pagination",
    auth: false,
    handler: ({ query }) => {
      const limit = parseInt(query.get("limit") || "20", 10);
      const offset = parseInt(query.get("offset") || "0", 10);
      const sort = query.get("sort") || "trending";

      const published = seedProjects.filter(p => !p.isDraft);
      const sorted = [...published].sort((a, b) => {
        if (sort === "top") return b.weighted - a.weighted;
        if (sort === "new")
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        // Trending
        const now = Date.now();
        const score = (p: typeof a) => {
          const hoursAge =
            (now - new Date(p.date).getTime()) / 3600000;
          return p.weighted / Math.pow(hoursAge + 2, 1.5);
        };
        return score(b) - score(a);
      });

      return ok({
        projects: sorted.slice(offset, offset + limit),
        totalCount: sorted.length,
        votedProjectIds: [],
      });
    },
  },

  {
    method: "GET",
    path: "/projects/:id",
    description: "Get a single project by ID or slug",
    auth: false,
    handler: ({ params }) => {
      const project = seedProjects.find(
        (p) =>
          String(p.id) === params.id ||
          String(p.name).toLowerCase().replace(/\s+/g, "-") === params.id
      );
      return ok({ project: project || null });
    },
  },

  {
    method: "POST",
    path: "/projects",
    description: "Create a new project (requires auth). Fields: name, tagline, description, url, stack, buildProcess, isDraft",
    auth: true,
    handler: ({ body }) => {
      return ok({
        project: {
          id: "mock-new",
          name: body.name || "New Project",
          isDraft: body.isDraft || false,
          buildProcess: body.buildProcess || "",
        },
      });
    },
  },

  {
    method: "PUT",
    path: "/projects/:id",
    description: "Update a project (requires auth). Can update isDraft, url, etc.",
    auth: true,
    handler: ({ params }) => {
      return ok({ project: { id: params.id }, success: true });
    },
  },

  {
    method: "GET",
    path: "/my-projects",
    description: "List the authenticated user's own projects",
    auth: true,
    handler: () => ok({ projects: [] }),
  },
];

export default routes;
