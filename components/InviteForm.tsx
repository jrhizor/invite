"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { LuCalendarDays } from "react-icons/lu";
import {
  CalendarEvent,
  google,
  office365,
  outlook,
  yahoo,
} from "calendar-link";
import { usePlausible } from "next-plausible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CalendarType = "google" | "office365" | "outlook" | "yahoo";

const FormSchema = z.object({
  calendar: z.enum(["google", "office365", "outlook", "yahoo"]),
  details: z.string().default(""),
});

function getLocalTime() {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long", // e.g., "Monday"
    year: "numeric", // e.g., "2024"
    month: "long", // e.g., "August"
    day: "numeric", // e.g., "14"
    hour: "numeric", // e.g., "4 PM"
    minute: "numeric", // e.g., "30"
    second: "numeric", // e.g., "45"
    timeZoneName: "short", // e.g., "GMT+5:30"
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  return formatter.format(new Date());
}

function getInvite(
  calendar: CalendarType,
  originalEvent: CalendarEvent,
): string {
  const event = { ...originalEvent };
  if (event.description !== undefined) {
    event.description += "\n\n------\nEvent created by https://www.invite.sh";
  } else {
    event.description = "Event created by https://www.invite.sh";
  }

  switch (calendar) {
    case "google":
      return google(event);
    case "office365":
      return office365(event);
    case "outlook":
      return outlook(event);
    case "yahoo":
      return yahoo(event);
  }
}

type PlausibleEvents = {
  submit: { calendar: string };
  error: { calendar: string };
  success: { calendar: string };
};

export function InviteForm() {
  const plausible = usePlausible<PlausibleEvents>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      calendar: "google",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      plausible("submit", { props: { calendar: data.calendar } });
      const response = await fetch("api/invites", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          details: data.details,
          localTime: getLocalTime(),
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        plausible("success", { props: { calendar: data.calendar } });
        setResult(responseData.events as CalendarEvent[]);
      } else {
        plausible("error", { props: { calendar: data.calendar } });
        setError(
          responseData.error || "A server error occurred. Please try again.",
        );
      }
    } catch (err) {
      plausible("error", { props: { calendar: data.calendar } });
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute -inset-6 bg-gray-100 bg-opacity-60 flex items-center justify-center z-10 rounded-b-lg">
          <LoadingSpinner />
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="calendar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calendar Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calendar type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="office365">Office365</SelectItem>
                    <SelectItem value="yahoo">Yahoo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide any details necessary to describe the event"
                    className="h-32"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  You can copy and paste an email or any event details here.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-fit">
            Create Invites
          </Button>
        </form>
      </Form>

      {!loading && (error || result) && <Separator className="mt-6" />}
      {error && <div className="mt-6 text-red-500">{error}</div>}
      {result && result.length === 0 && (
        <div className="mt-6">No events were found.</div>
      )}
      {result && result.length > 0 && (
        <div className="mt-6 w-full flex flex-col gap-3">
          {result.map((event, i) => {
            const calendar: CalendarType = form.getValues("calendar");
            const invite = getInvite(calendar, event);

            return (
              <Card key={i} className="w-full">
                <CardHeader className="hidden md:flex flex-row justify-between p-3 items-center space-y-0">
                  <div className="inline-flex gap-3 items-center text-muted-foreground">
                    <LuCalendarDays className="ml-1.5" />
                    <a
                      href={invite}
                      className="hover:text-primary hover:underline hover:underline-offset-4"
                      target="_blank"
                    >
                      {event.title}
                    </a>
                  </div>
                  <CopyInviteButton value={invite} className="m-0" />
                </CardHeader>

                <CardHeader className="flex flex-col p-3 space-y-0 md:hidden">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <LuCalendarDays />
                    <CopyInviteButton value={invite} className="m-0" />
                  </div>
                </CardHeader>

                <Separator className="md:hidden" />

                <CardContent className="p-3 text-muted-foreground md:hidden">
                  <a
                    href={invite}
                    className="hover:text-primary hover:underline hover:underline-offset-4"
                    target="_blank"
                  >
                    {event.title}
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
