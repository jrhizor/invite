import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
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
      allDay: z.boolean().optional().nullable().describe("All day event?"),
      rRule: z
        .string()
        .optional()
        .nullable()
        .describe("Recurring event - iCal recurrence rule string"),
      description: z
        .string()
        .optional()
        .nullable()
        .describe("Information about the event"),
      location: z.string().optional().nullable().describe("Event location"),
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

    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "The OPENROUTER_API_KEY environment variable is missing or empty.",
      );
    }

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

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.parse({
      model: "openai/gpt-5.1-chat",
      messages: [
        {
          role: "user",
          content: promptTemplate({
            localTime: localTime,
            details: details,
          }),
        },
      ],
      response_format: zodResponseFormat(eventsSchema, "events"),
    });

    const object = completion.choices[0].message.parsed;

    return Response.json(object);
  } catch (e: any) {
    console.error(e);
    const errorMessage = e.toString().includes("environment variable")
      ? "The server is configured incorrectly."
      : "An unknown server error occurred.";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
