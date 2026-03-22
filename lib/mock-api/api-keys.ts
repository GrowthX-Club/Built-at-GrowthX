import { MockRoute, ok } from "./types";

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/api-keys",
    description: "List user's API keys",
    auth: true,
    handler: () => ok({ success: true, api_keys: [] }),
  },

  {
    method: "POST",
    path: "/api-keys",
    description: "Create a new API key",
    auth: true,
    handler: () =>
      ok({
        success: true,
        api_key: "mock_bx_key_demo_123",
        msg: "API key created",
      }),
  },

  {
    method: "DELETE",
    path: "/api-keys/:id",
    description: "Revoke an API key",
    auth: true,
    handler: () => ok({ success: true, msg: "API key revoked" }),
  },
];

export default routes;
