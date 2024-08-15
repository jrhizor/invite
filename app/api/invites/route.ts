import { Ratelimit } from "@upstash/ratelimit";
import { createAzure } from "@ai-sdk/azure";
import { Redis } from "@upstash/redis";

export async function POST(req: Request) {
  try {
    const redisUrl = process.env["REDIS_URL"];
    if (!redisUrl) {
      throw new Error(
        "The REDIS_URL environment variable is missing or empty.",
      );
    }

    const redisToken = process.env["REDIS_TOKEN"];
    if (!redisToken) {
      throw new Error(
        "The REDIS_TOKEN environment variable is missing or empty.",
      );
    }

    const resourceName = process.env["AZURE_OPENAI_RESOURCE_NAME"];
    if (!resourceName) {
      throw new Error(
        "The AZURE_OPENAI_RESOURCE_NAME environment variable is missing or empty.",
      );
    }

    const apiKey = process.env["AZURE_OPENAI_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "The AZURE_OPENAI_API_KEY environment variable is missing or empty.",
      );
    }

    const deploymentId = process.env["AZURE_OPENAI_DEPLOYMENT_ID"];
    if (!deploymentId) {
      throw new Error(
        "The AZURE_OPENAI_DEPLOYMENT_ID environment variable is missing or empty.",
      );
    }

    const model = createAzure({
      resourceName: resourceName,
      apiKey: apiKey,
    }).chat(deploymentId);

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const ip = req.headers.get("x-forwarded-for");

    const ratelimit = new Ratelimit({
      redis: redis,
      // rate limit to 5 requests per 60 seconds
      limiter: Ratelimit.slidingWindow(5, "60s"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `invite_ratelimit_${ip}`,
    );

    if (!success) {
      return new Response(
        "Slow down, you are making too many requests. If you want to increase your rate limit please email contact@invite.sh.",
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    const { details } = await req.json();

    if (details === undefined || details.length === 0) {
      return Response.json(
        { error: "You must provide event details to create an invite!" },
        { status: 500 },
      );
    }

    // todo: create invites

    return Response.json({ invites: [] });
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.toString().includes("environment variable")
      ? "The server is configured incorrectly."
      : "An unknown server error occurred.";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
