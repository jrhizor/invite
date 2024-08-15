import { LuCalendarPlus } from "react-icons/lu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InviteForm } from "@/components/InviteForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-24 bg-gray-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <Card>
          <CardHeader>
            <div className="inline-flex gap-1 items-center">
              <LuCalendarPlus />
              <h1 className="font-mono">invite.sh</h1>
            </div>
            <CardDescription>Easily create calendar events!</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 flex flex-col gap-6">
            <InviteForm />
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" className="py-6 w-full max-w-4xl" collapsible>
        <AccordionItem value="item-0">
          <AccordionTrigger>What calendars are supported?</AccordionTrigger>
          <AccordionContent>
            Google, Outlook, Office365, and Yahoo calendars are supported.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            What kind of events are supported?
          </AccordionTrigger>
          <AccordionContent>
            All events are supported. A description of an event can be anything
            from &quot;lunch tomorrow at noon at The Sentinel&quot; to copy and
            pasting a flight confirmation to copy and pasting a wedding
            itinerary. This will give you calendar invite links for each event
            extracted from the text.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How are timezones handled?</AccordionTrigger>
          <AccordionContent>
            If you include a timezone, it will be respected in the invite. If no
            timezone is specified and the event is something local (like a lunch
            appointment), your calendar&apos;s default timezone will be used.
            However, if the event is a flight or hotel booking, the
            airport/hotel information will be used to infer the timezone.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is my data private?</AccordionTrigger>
          <AccordionContent>
            Your data is sent to our host Vercel and relayed through OpenAI.
            Your descriptions of events and the invite links are not persisted.
            The code for invite.sh is available on{" "}
            <a
              href="https://github.com/jrhizor/invite"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <footer className="py-6 md:px-8 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://jrhizor.dev"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Jared Rhizor
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/jrhizor/invite"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
