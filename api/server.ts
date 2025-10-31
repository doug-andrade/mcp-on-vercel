import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler((server) => {

  server.tool(
    "searchPeopleContacts",
    "Searches Apollo contacts by company domain or organization id.",
    {
      domain: z.string().trim().min(1).optional(),
      organizationId: z.string().trim().min(1).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(100),
    },
    async ({ domain, organizationId, page, limit }) => {
      if (!domain && !organizationId) {
        throw new Error("Provide either domain or organizationId.");
      }

      const apiKey = process.env.APOLLO_API_KEY;
      if (!apiKey) {
        throw new Error("APOLLO_API_KEY environment variable is required.");
      }

      const perPage = Math.min(limit, 100);
      const payload: Record<string, unknown> = {
        page,
        per_page: perPage,
      };

      if (domain) {
        payload.q_organization_domains = domain;
      }

      if (organizationId) {
        payload.organization_ids = [organizationId];
      }

      const response = await fetch(
        "https://api.apollo.io/api/v1/mixed_people/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Apollo API request failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
  server.tool(
    "enrichOrganization",
    "Enriches company details by domain or organization id.",
    {
      domain: z.string().trim().min(1).optional(),
      organizationId: z.string().trim().min(1).optional(),
    },
    async ({ domain, organizationId }) => {
      if (!domain && !organizationId) {
        throw new Error("Provide either domain or organizationId.");
      }

      const apiKey = process.env.APOLLO_API_KEY;
      if (!apiKey) {
        throw new Error("APOLLO_API_KEY environment variable is required.");
      }

      const payload: Record<string, unknown> = {};

      if (domain) {
        payload.domain = domain;
      }

      if (organizationId) {
        payload.organization_id = organizationId;
      }

      const response = await fetch(
        "https://api.apollo.io/api/v1/organizations/enrich",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Apollo organization enrichment failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );
});

export { handler as GET, handler as POST, handler as DELETE };
