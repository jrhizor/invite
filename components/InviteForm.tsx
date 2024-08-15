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
import { Card, CardHeader } from "@/components/ui/card";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { LuCalendarDays } from "react-icons/lu";

const FormSchema = z.object({
  details: z.string().default(""),
});

interface Invite {
  name: string;
  link: string;
}

export function InviteForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Invite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("api/invites", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          details: data.details,
          local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setResult(responseData.invites as Invite[]);
      } else {
        setError(
          responseData.error || "A server error occurred. Please try again.",
        );
      }
    } catch (err) {
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
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide any details necessary to describe the event"
                    className="resize-none"
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
          {result.map((invite, i) => {
            return (
              <Card key={i} className="w-full">
                <CardHeader className="flex flex-row justify-between p-3 items-center space-y-0">
                  <div className="inline-flex gap-3 items-center text-muted-foreground">
                    <LuCalendarDays className="ml-1.5" />
                    <a
                      href={invite.link}
                      className="hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {invite.name}
                    </a>
                  </div>
                  <CopyInviteButton value={invite.link} className="m-0" />
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
