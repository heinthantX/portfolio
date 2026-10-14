import { describe, expect, it } from "vitest";
import { contactSchema } from "./schema";

describe("contactSchema", () => {
  const validPayload = {
    name: "Hein Thant",
    email: "hein@example.com",
    message: "I would like to discuss a full-stack platform opportunity.",
  };

  it("accepts a valid payload without honeypot", () => {
    const result = contactSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Hein Thant");
      expect(result.data.email).toBe("hein@example.com");
      expect(result.data.message).toBe(
        "I would like to discuss a full-stack platform opportunity.",
      );
    }
  });

  it("accepts a valid payload with empty string honeypot", () => {
    const result = contactSchema.safeParse({
      ...validPayload,
      company: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with undefined honeypot", () => {
    const result = contactSchema.safeParse({
      ...validPayload,
      company: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects honeypot if company is filled", () => {
    const result = contactSchema.safeParse({
      ...validPayload,
      company: "Bot Spammer Corp",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.company).toBeDefined();
    }
  });

  describe("name validation", () => {
    it("rejects name shorter than 2 characters", () => {
      const result = contactSchema.safeParse({
        ...validPayload,
        name: "H",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("rejects name longer than 80 characters", () => {
      const result = contactSchema.safeParse({
        ...validPayload,
        name: "A".repeat(81),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("accepts boundary name lengths (2 and 80 characters)", () => {
      expect(
        contactSchema.safeParse({
          ...validPayload,
          name: "HT",
        }).success,
      ).toBe(true);

      expect(
        contactSchema.safeParse({
          ...validPayload,
          name: "A".repeat(80),
        }).success,
      ).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email formats", () => {
      const invalidEmails = [
        "plainaddress",
        "@missingusername.com",
        "username@.com",
        "username@domain",
        "username@domain..com",
        "",
      ];

      for (const email of invalidEmails) {
        const result = contactSchema.safeParse({
          ...validPayload,
          email,
        });
        expect(result.success).toBe(false);
      }
    });

    it("accepts valid email addresses", () => {
      const validEmails = ["user@example.com", "first.last@company.co.uk", "dev+test@platform.io"];

      for (const email of validEmails) {
        const result = contactSchema.safeParse({
          ...validPayload,
          email,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("message validation", () => {
    it("rejects message shorter than 10 characters", () => {
      const result = contactSchema.safeParse({
        ...validPayload,
        message: "Hi there!", // 9 characters
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message).toBeDefined();
      }
    });

    it("rejects message longer than 2000 characters", () => {
      const result = contactSchema.safeParse({
        ...validPayload,
        message: "M".repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message).toBeDefined();
      }
    });

    it("accepts boundary message lengths (10 and 2000 characters)", () => {
      expect(
        contactSchema.safeParse({
          ...validPayload,
          message: "1234567890", // 10 characters
        }).success,
      ).toBe(true);

      expect(
        contactSchema.safeParse({
          ...validPayload,
          message: "A".repeat(2000), // 2000 characters
        }).success,
      ).toBe(true);
    });
  });
});
