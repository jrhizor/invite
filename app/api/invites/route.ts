import { Ratelimit } from "@upstash/ratelimit";
import { createAzure } from "@ai-sdk/azure";
import { Redis } from "@upstash/redis";
import { generateObject } from "ai";
import { z } from "zod";
import Handlebars from "handlebars";

const promptTemplate = Handlebars.compile(
  `
You are a helpful assistant for Google Calendar. 
Your job is to take text and create one or more Google Calendar invite links from it.

You will be given a description of an event or multiple events. 
This may be in the form of an email or just a text description of the events.

If a timezone is included, it must be respected in the invite links you generate.
If no timezone is specified and the event is something local (like a lunch appointment), use the local timezone.
If the event is a flight, hotel booking, etc, use the location information provided to infer the timezone.

Current Local Time:
{{ localTime }}

Event Details:
{{{ details }}}

Output a list of all events.
`.trim(),
);

const eventsSchema = z.object({
  events: z.array(
    z.object({
      title: z.string().min(1).describe("Event title (required)"),
      start: z
        .string()
        .min(1)
        .describe("Start time as ISO 8601 string (required)"),
      end: z.string().min(1).describe("End time as ISO 8601 string (required)"),
      allDay: z.boolean().optional().describe("All day event?"),
      rRule: z
        .string()
        .optional()
        .describe("Recurring event - iCal recurrence rule string"),
      description: z
        .string()
        .optional()
        .describe("Information about the event"),
      location: z.string().optional().describe("Event location"),
      busy: z.boolean().default(true).describe("Mark on calendar as busy?"),
    }),
  ),
});

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
      limiter: Ratelimit.slidingWindow(4, "1m"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `invite_ratelimit_${ip}`,
    );

    if (!success) {
      return Response.json(
        {
          error:
            "Slow down, you are making too many requests. If you want to increase your rate limit please email: contact@invite.sh",
        },
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

    const { localTime, details } = await req.json();

    if (details === undefined || details.length === 0) {
      return Response.json(
        { error: "You must provide event details to create an invite!" },
        { status: 400 },
      );
    }

    const { object } = await generateObject({
      model: model,
      temperature: 0,
      maxTokens: 1024,
      schema: eventsSchema,
      prompt: promptTemplate({
        localTime: localTime,
        details: details,
      }),
    });

    return Response.json(object);
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.toString().includes("environment variable")
      ? "The server is configured incorrectly."
      : "An unknown server error occurred.";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
