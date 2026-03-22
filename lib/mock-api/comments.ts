import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/comments",
    description: "List comments for a project. Query: ?projectId=...",
    auth: false,
    handler: () => ok({ comments: [] }),
  },

  {
    method: "POST",
    path: "/comments",
    description: "Add a comment (requires auth). Body: { projectId, content, parentId? }",
    auth: true,
    handler: () =>
      ok({
        comment: {
          id: "mock-comment-" + Date.now(),
          content: "Mock comment",
          createdAt: new Date().toISOString(),
        },
      }),
  },

  {
    method: "POST",
    path: "/comments/:id/react",
    description: "Add reaction to a comment (requires auth). Body: { emoji_code }",
    auth: true,
    handler: () => ok({ success: true }),
  },
];

export default routes;
