"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ContactFormState, submitContact } from "./actions";
import { type ContactInput, contactSchema } from "./schema";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      message: "",
      company: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Message sent successfully! I’ll get back to you soon.");
      reset();
    } else if (state.status === "error") {
      toast.error(state.message || "Failed to send message. Please review the form.");
      if (state.fieldErrors) {
        for (const [field, messages] of Object.entries(state.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ContactInput, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
    } else if (state.status === "rate-limited") {
      toast.error(`Rate limited. Please retry in ${state.retryAfterSec} seconds.`);
    }
  }, [state, reset, setError]);

  const onSubmit = (data: ContactInput) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("message", data.message);
      if (data.company) {
        formData.append("company", data.company);
      }
      formAction(formData);
    });
  };

  return (
    <div className="w-full space-y-6">
      {state.status === "success" && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-ok/30 bg-surface p-4 text-ok"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="size-2 rounded-full bg-ok" />
            </span>
            <p className="font-mono text-xs tracking-[0.12em] uppercase">Message sent</p>
          </div>
          <p className="mt-2 text-sm text-ok">
            Thank you for reaching out. Your message has been delivered, and I’ll reply shortly.
          </p>
        </div>
      )}

      {state.status === "rate-limited" && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-signal/40 bg-surface p-4 text-text"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-signal" aria-hidden="true" />
            <p className="font-mono text-xs tracking-[0.12em] text-signal uppercase">
              Rate limit reached
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Too many submissions received. Please wait{" "}
            <span className="font-mono font-medium text-signal">{state.retryAfterSec} seconds</span>{" "}
            before trying again.
          </p>
        </div>
      )}

      {state.status === "error" && !state.fieldErrors && (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-surface p-4 font-mono text-xs text-danger"
        >
          {state.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-md border border-line bg-surface p-6 sm:p-8"
        noValidate
      >
        {/* Name field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase"
          >
            Name <span className="text-signal">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            disabled={isPending}
            className="border-line-strong bg-surface-2 focus-visible:border-signal"
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="font-mono text-xs text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase"
          >
            Email <span className="text-signal">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@domain.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isPending}
            className="border-line-strong bg-surface-2 focus-visible:border-signal"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="font-mono text-xs text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Message field */}
        <div className="space-y-2">
          <Label
            htmlFor="message"
            className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase"
          >
            Message <span className="text-signal">*</span>
          </Label>
          <Textarea
            id="message"
            rows={5}
            placeholder="Tell me about your project, team, or opportunity..."
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
            disabled={isPending}
            className="border-line-strong bg-surface-2 focus-visible:border-signal"
            {...register("message")}
          />
          {errors.message && (
            <p id="message-error" className="font-mono text-xs text-danger">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Honeypot field (hidden from screen readers and pointer) */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("company")}
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Send message
          </Button>
        </div>
      </form>
    </div>
  );
}
