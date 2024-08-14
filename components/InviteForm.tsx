"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

const FormSchema = z.object({
  details: z.string().min(10, {
    message: "Details must have least 10 characters.",
  }),
});

export function InviteForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // todo: capture and submit local time zone
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                />
              </FormControl>
              <FormDescription>
                You can copy and paste an email or any event details here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Invites</Button>
      </form>
    </Form>
  );
}
