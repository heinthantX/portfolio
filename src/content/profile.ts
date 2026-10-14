import { profileSchema } from "./profile.schema";

export const profile = profileSchema.parse({
  name: "Hein Thant",
  title: "Full-Stack & DevOps Engineer",
  tagline: "From the interface to the infrastructure.",
  bio: [
    "Full-stack engineer who likes the hard parts: data models that stay correct, permissions that stay tight, apps that keep working offline, and services that stay fast under load.",
    "I ship end to end, from Postgres and APIs to React and React Native, to the containers, clusters and CI pipelines they run on.",
  ],
  pullQuote: "From the interface to the infrastructure: I build and ship every layer.",
  location: "Bangkok time (UTC+7)",
  availability: {
    label: "Open to full-stack and platform roles.",
    open: true,
  },
  contact: {
    email: "hello@example.com",
    github: {
      label: "[MOCK] github.com/handle",
      href: "https://github.com/",
    },
    linkedin: {
      label: "[MOCK] linkedin.com/in/handle",
      href: "https://linkedin.com/",
    },
  },
  capabilities: [
    {
      id: "frontend",
      title: "Front end",
      stack: ["React", "Next.js", "TypeScript", "Tailwind"],
      pitch: "Fast, accessible interfaces that feel finished",
      cover: "/media/cap-frontend.avif",
    },
    {
      id: "mobile",
      title: "Mobile & offline",
      stack: ["React Native", "offline-first sync"],
      pitch: "Apps that keep working without a network",
      cover: "/media/cap-mobile.avif",
    },
    {
      id: "backend",
      title: "Back-end & APIs",
      stack: ["Node.js", "NestJS", "Go", "REST", "GraphQL"],
      pitch: "Typed, well-tested APIs with clear contracts",
      cover: "/media/cap-backend.avif",
    },
    {
      id: "data",
      title: "Data",
      stack: ["Postgres", "Drizzle", "Prisma", "Redis"],
      pitch: "Schemas and migrations that are safe to evolve",
      cover: "/media/cap-data.avif",
    },
    {
      id: "security",
      title: "Security & access",
      stack: ["Auth", "RBAC", "scoped queries"],
      pitch: "Permission models that are hard to get wrong",
      cover: "/media/cap-security.avif",
    },
    {
      id: "devops",
      title: "DevOps & cloud",
      stack: ["Docker", "Kubernetes", "Azure", "DigitalOcean", "IaC", "GitHub Actions"],
      pitch: "Shipping and running services reliably",
      cover: "/media/cap-devops.avif",
    },
    {
      id: "observability",
      title: "Observability & performance",
      stack: ["Prometheus", "logging", "k6", "Locust", "caching"],
      pitch: "Finding the real limit, then raising it",
      cover: "/media/cap-observability.avif",
    },
  ],
  experience: [
    {
      role: "Full-Stack Engineer",
      company: "[MOCK] Company",
      years: "[MOCK] 2024–Present",
      bullets: [
        "Built typed, well-tested APIs with clear contracts using NestJS and Go.",
        "Delivered fast, accessible interfaces that feel finished in React and Next.js.",
        "Engineered schemas and migrations in Postgres that are safe to evolve under continuous deployment.",
      ],
    },
    {
      role: "Full-Stack Engineer",
      company: "[MOCK] Company",
      years: "[MOCK] 2022–2024",
      bullets: [
        "Developed mobile applications using React Native designed to keep working without a network.",
        "Implemented permission models and role-based access controls that are hard to get wrong.",
        "Configured containerized deployments and automated GitHub Actions pipelines for reliable shipping.",
      ],
    },
    {
      role: "Platform & DevOps Engineer",
      company: "[MOCK] Company",
      years: "[MOCK] 2020–2022",
      bullets: [
        "Managed Docker and Kubernetes workloads with infrastructure as code across cloud environments.",
        "Established observability pipelines with Prometheus and structured logging to find real system limits.",
        "Conducted load testing with k6 and Locust to stress-test APIs and optimize caching strategies.",
      ],
    },
  ],
  stackLayers: [
    {
      id: "interface",
      label: "INTERFACE",
      tech: ["React", "Next.js", "React Native", "TypeScript", "Tailwind"],
    },
    {
      id: "api",
      label: "API",
      tech: ["NestJS", "Go", "Node.js", "REST", "GraphQL"],
    },
    {
      id: "data",
      label: "DATA",
      tech: ["Postgres", "Redis", "Drizzle", "Prisma"],
    },
    {
      id: "infra",
      label: "INFRASTRUCTURE",
      tech: ["Docker", "Kubernetes", "GitHub Actions", "Terraform", "Azure", "DigitalOcean"],
    },
    {
      id: "tools",
      label: "TOOLS",
      tech: ["Prometheus", "k6", "Locust", "Biome", "Playwright"],
    },
  ],
  principles: [
    {
      title: "Correctness before cleverness",
      body: "Code is read and debugged far more often than it is written, so clarity is the primary feature. Systems should fail explicitly and handle edge cases at the boundaries rather than masking subtle bugs.",
    },
    {
      title: "Tight contracts and typed boundaries",
      body: "Rigid type systems and schema validations prevent entire classes of runtime defects before deployment. When APIs, databases, and clients share explicit contracts, teams can refactor with confidence.",
    },
    {
      title: "Automate every gate",
      body: "Manual verification degrades over time and creates friction in the release cycle. Deterministic CI pipelines, container builds, and end-to-end assertions ensure every release meets the quality floor.",
    },
    {
      title: "Measure real ceilings",
      body: "Premature optimization wastes effort, while unmeasured bottlenecks surprise production systems under load. Profiling with realistic workloads and synthetic traffic exposes actual limits before users encounter them.",
    },
  ],
  uses: [
    {
      group: "Editor & terminal",
      items: [
        {
          name: "VS Code / Cursor",
          note: "Primary editing environment with strict formatting and linting extensions.",
        },
        {
          name: "Ghostty & zsh",
          note: "GPU-accelerated terminal paired with minimal prompt and tmux sessions.",
        },
      ],
    },
    {
      group: "Languages & runtimes",
      items: [
        {
          name: "TypeScript & Node.js",
          note: "Primary language across frontend, server runtimes, and build scripts.",
        },
        {
          name: "Go",
          note: "Preferred runtime for high-throughput network services and single-binary tools.",
        },
      ],
    },
    {
      group: "AI-assisted workflow",
      items: [
        {
          name: "Dual-model orchestration",
          note: "Claude Code conducts and reviews, Gemini via agy implements spec’d units, every gate human-verified.",
        },
      ],
    },
    {
      group: "Hardware [CONFIRM]",
      items: [
        {
          name: "MacBook Pro [CONFIRM]",
          note: "Apple Silicon development machine for local Docker and build pipelines.",
        },
        {
          name: "External 4K Display [CONFIRM]",
          note: "High-resolution monitor for split-pane code and terminal workflows.",
        },
      ],
    },
  ],
  now: {
    updated: "2026-10",
    items: [
      "[MOCK] Building an offline-first field synchronization architecture with local storage SQLite.",
      "[MOCK] Investigating zero-downtime database migration patterns for high-throughput Postgres tables.",
      "[MOCK] Experimenting with WebGPU compute shaders and declarative 3D interfaces in React Three Fiber.",
    ],
  },
});
