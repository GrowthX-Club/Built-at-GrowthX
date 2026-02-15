import {
  Project,
  BuildingProject,
  BuilderProfile,
  CityData,
  ThreadData,
  CUSTOM_EMOJIS,
} from "@/types";

export const seedProjects: Project[] = [
  {
    id: 1,
    name: "ContextPilot",
    tagline: "AI copilot that understands your entire codebase context",
    description:
      "ContextPilot indexes your entire repository and provides contextual AI assistance that actually understands your architecture, patterns, and business logic. Unlike generic AI tools, it builds a knowledge graph of your codebase.",
    builder: {
      name: "Arjun Mehta",
      avatar: "AM",
      city: "Bangalore",
      title: "CTO",
      company: "ContextPilot",
      companyColor: "#2255CC",
    },
    collabs: [
      {
        avatar: "AR",
        name: "Ananya Reddy",
        title: "Frontend Lead",
        company: "BuildKit",
        companyColor: "#059669",
      },
    ],
    weighted: 142,
    raw: 38,
    category: "AI tool",
    stack: ["Next.js", "Claude API", "Supabase", "Vercel"],
    buildathon: "Bangalore Buildathon #12",
    heroColor: "#2255CC",
    featured: true,
    date: "Feb 1",
    gallery: [
      { type: "App", label: "Dashboard view", colors: ["#2255CC", "#61DAFB"] },
      {
        type: "CLI",
        label: "Terminal output",
        colors: ["#1a1a2e", "#16213e"],
      },
      {
        type: "API",
        label: "Response format",
        colors: ["#0f3460", "#533483"],
      },
    ],
  },
  {
    id: 2,
    name: "ShipLog",
    tagline: "Build in public with structured shipping logs",
    description:
      "ShipLog helps indie hackers and builders document their journey with structured build logs. Auto-generates changelog from git commits, integrates with Twitter for build-in-public threads.",
    builder: {
      name: "Priya Sharma",
      avatar: "PS",
      city: "Delhi",
      title: "Solo Builder",
      company: "ShipFast Labs",
      companyColor: "#7C3AED",
    },
    collabs: [],
    weighted: 118,
    raw: 31,
    category: "SaaS",
    stack: ["React", "Node.js", "Supabase"],
    buildathon: "Bangalore Buildathon #12",
    heroColor: "#7C3AED",
    featured: true,
    date: "Feb 1",
    gallery: [
      {
        type: "Web",
        label: "Public profile",
        colors: ["#7C3AED", "#A78BFA"],
      },
      { type: "Bot", label: "Twitter bot", colors: ["#1DA1F2", "#0d8bd9"] },
    ],
  },
  {
    id: 3,
    name: "NeuralDocs",
    tagline: "Turn any documentation into an AI-powered knowledge base",
    description:
      "NeuralDocs ingests your documentation (Notion, Confluence, Google Docs) and creates an intelligent Q&A system for your team. Supports follow-up questions, cites sources, and learns from feedback.",
    builder: {
      name: "Sneha Iyer",
      avatar: "SI",
      city: "Pune",
      title: "AI/ML Lead",
      company: "NeuralDocs",
      companyColor: "#059669",
    },
    collabs: [
      {
        avatar: "NA",
        name: "Nisha Agarwal",
        title: "Backend",
        company: "DataWeave",
        companyColor: "#B45309",
      },
    ],
    weighted: 108,
    raw: 28,
    category: "AI tool",
    stack: ["Python", "FastAPI", "React", "PostgreSQL"],
    buildathon: "The Great Indian AI Batch 1",
    heroColor: "#059669",
    featured: false,
    date: "Jan 15",
    gallery: [
      { type: "App", label: "Chat interface", colors: ["#059669", "#34D399"] },
      {
        type: "Integration",
        label: "Slack bot",
        colors: ["#4A154B", "#611f69"],
      },
    ],
  },
  {
    id: 4,
    name: "QuickLaunch",
    tagline: "Landing page builder that ships in 10 minutes",
    description:
      "QuickLaunch generates conversion-optimized landing pages from a brief description. Uses AI to write copy, select layouts, and generate images. One-click deploy to Vercel or Netlify.",
    builder: {
      name: "Karan Patel",
      avatar: "KP",
      city: "Hyderabad",
      title: "Founder",
      company: "QuickLaunch",
      companyColor: "#DC2626",
    },
    collabs: [
      {
        avatar: "VS",
        name: "Vikram Singh",
        title: "Full Stack",
        company: "DevFlow",
        companyColor: "#2563EB",
      },
    ],
    weighted: 95,
    raw: 26,
    category: "SaaS",
    stack: ["Next.js", "GPT-4", "Vercel"],
    buildathon: "Delhi AI Hackathon",
    heroColor: "#DC2626",
    featured: false,
    date: "Jan 25",
    gallery: [
      {
        type: "Web",
        label: "Generated page",
        colors: ["#DC2626", "#F87171"],
      },
      { type: "Editor", label: "Visual editor", colors: ["#1E293B", "#334155"] },
    ],
  },
  {
    id: 5,
    name: "DevFlow",
    tagline: "Visual workflow builder for developer pipelines",
    description:
      "DevFlow lets you build CI/CD pipelines, data pipelines, and automation workflows with a visual drag-and-drop interface. Generates clean YAML configs for GitHub Actions, GitLab CI, and Jenkins.",
    builder: {
      name: "Vikram Singh",
      avatar: "VS",
      city: "Delhi",
      title: "Lead",
      company: "DevFlow",
      companyColor: "#2563EB",
    },
    collabs: [
      {
        avatar: "AJ",
        name: "Aditya Joshi",
        title: "Product",
        company: "LaunchPad",
        companyColor: "#B45309",
      },
    ],
    weighted: 87,
    raw: 24,
    category: "Developer tool",
    stack: ["React", "Node.js", "PostgreSQL"],
    buildathon: "Delhi AI Hackathon",
    heroColor: "#2563EB",
    featured: false,
    date: "Jan 25",
    gallery: [
      {
        type: "App",
        label: "Flow editor",
        colors: ["#2563EB", "#60A5FA"],
      },
      { type: "Output", label: "YAML preview", colors: ["#1E293B", "#475569"] },
    ],
  },
  {
    id: 6,
    name: "BuildKit",
    tagline: "Component library with built-in analytics tracking",
    description:
      "BuildKit is a React component library where every component has built-in analytics. Track button clicks, form completions, page views \u2014 all without writing a single line of tracking code.",
    builder: {
      name: "Ananya Reddy",
      avatar: "AR",
      city: "Bangalore",
      title: "Creator",
      company: "BuildKit",
      companyColor: "#059669",
    },
    collabs: [],
    weighted: 76,
    raw: 21,
    category: "Developer tool",
    stack: ["React", "Node.js"],
    buildathon: "Pune Builder Weekend",
    heroColor: "#059669",
    featured: false,
    date: "Jan 18",
    gallery: [
      {
        type: "Docs",
        label: "Component docs",
        colors: ["#059669", "#6EE7B7"],
      },
      {
        type: "Dashboard",
        label: "Analytics view",
        colors: ["#1E293B", "#334155"],
      },
    ],
  },
];

export const seedBuilding: BuildingProject[] = [
  {
    id: 101,
    name: "FormCraft",
    tagline: "AI-powered form builder that writes its own validation",
    builder: { name: "Aditya Joshi", avatar: "AJ", role: "founder", city: "Delhi" },
    status: "prototyping",
    watchers: 24,
    log: "Got conditional logic working. Dynamic field deps are tricky but cracked it.",
    logDate: "2h ago",
    help: "Looking for a designer to help with the form builder UI",
  },
  {
    id: 102,
    name: "ScreenRec",
    tagline: "Instant screen recordings with AI-generated summaries",
    builder: { name: "Priya Sharma", avatar: "PS", role: "builder", city: "Delhi" },
    status: "beta",
    watchers: 41,
    log: "Beta launched! 67 users in first week. Working on Chrome extension stability.",
    logDate: "5h ago",
    help: null,
  },
  {
    id: 103,
    name: "PromptVault",
    tagline: "Version control and team sharing for AI prompts",
    builder: { name: "Arjun Mehta", avatar: "AM", role: "builder", city: "Bangalore" },
    status: "idea",
    watchers: 18,
    log: "Exploring diff algorithms for prompt versioning. Git-style or custom?",
    logDate: "1d ago",
    help: "Need feedback on the versioning UX \u2014 git-like or simpler?",
  },
  {
    id: 104,
    name: "APIBridge",
    tagline: "Universal API adapter that translates between any two APIs",
    builder: { name: "Vikram Singh", avatar: "VS", role: "builder", city: "Delhi" },
    status: "prototyping",
    watchers: 15,
    log: "Mapping layer working for REST. Starting GraphQL adapter next.",
    logDate: "3h ago",
    help: "Looking for someone with GraphQL expertise",
  },
];

export const seedBuilders: BuilderProfile[] = [
  { name: "Arjun Mehta", avatar: "AM", role: "builder", city: "Bangalore", rep: 847, shipped: 4, bio: "Full-stack dev building AI tools" },
  { name: "Priya Sharma", avatar: "PS", role: "builder", city: "Delhi", rep: 723, shipped: 3, bio: "Product designer turned builder" },
  { name: "Sneha Iyer", avatar: "SI", role: "builder", city: "Pune", rep: 612, shipped: 2, bio: "AI researcher shipping real products" },
  { name: "Karan Patel", avatar: "KP", role: "founder", city: "Hyderabad", rep: 534, shipped: 3, bio: "Serial founder, building tools" },
  { name: "Ananya Reddy", avatar: "AR", role: "builder", city: "Bangalore", rep: 489, shipped: 2, bio: "Frontend engineer, React specialist" },
  { name: "Vikram Singh", avatar: "VS", role: "builder", city: "Delhi", rep: 398, shipped: 2, bio: "Backend & developer infrastructure" },
  { name: "Meera Krishnan", avatar: "MK", role: "builder", city: "Bangalore", rep: 567, shipped: 3, bio: "Chrome extensions & dev tools" },
  { name: "Aditya Joshi", avatar: "AJ", role: "founder", city: "Delhi", rep: 445, shipped: 2, bio: "Building LaunchPad for startups" },
  { name: "Nisha Agarwal", avatar: "NA", role: "builder", city: "Pune", rep: 378, shipped: 2, bio: "Data engineer, Python & Go" },
  { name: "Deepa Nair", avatar: "DN", role: "host", city: "Pune", rep: 234, shipped: 0, bio: "GrowthX Pune chapter lead" },
];

export const seedCities: CityData[] = [
  { name: "Bangalore", builders: 48, shipped: 23, flag: "\u{1F1EE}\u{1F1F3}", trend: "+5 this month" },
  { name: "Delhi", builders: 35, shipped: 18, flag: "\u{1F1EE}\u{1F1F3}", trend: "+3 this month" },
  { name: "Pune", builders: 22, shipped: 12, flag: "\u{1F1EE}\u{1F1F3}", trend: "+2 this month" },
  { name: "Hyderabad", builders: 19, shipped: 9, flag: "\u{1F1EE}\u{1F1F3}", trend: "+4 this month" },
  { name: "Mumbai", builders: 31, shipped: 15, flag: "\u{1F1EE}\u{1F1F3}", trend: "+2 this month" },
  { name: "Chennai", builders: 14, shipped: 7, flag: "\u{1F1EE}\u{1F1F3}", trend: "+1 this month" },
  { name: "Gurgaon", builders: 17, shipped: 8, flag: "\u{1F1EE}\u{1F1F3}", trend: "+3 this month" },
  { name: "Kolkata", builders: 8, shipped: 4, flag: "\u{1F1EE}\u{1F1F3}", trend: "+1 this month" },
  { name: "Ahmedabad", builders: 6, shipped: 3, flag: "\u{1F1EE}\u{1F1F3}", trend: "New!" },
  { name: "Jaipur", builders: 5, shipped: 2, flag: "\u{1F1EE}\u{1F1F3}", trend: "New!" },
  { name: "Kochi", builders: 4, shipped: 2, flag: "\u{1F1EE}\u{1F1F3}", trend: "New!" },
];

const E = CUSTOM_EMOJIS;

export const seedThreads: ThreadData[] = [
  {
    id: "t1",
    author: {
      name: "Arjun Mehta",
      avatar: "AM",
      role: "builder",
      rep: 847,
      title: "CTO",
      company: "ContextPilot",
      companyColor: "#2255CC",
    },
    content:
      "Just shipped ContextPilot v2 with multi-repo support. The knowledge graph now connects patterns across your entire org's codebase. Feels like a massive unlock for large teams.",
    time: "2h ago",
    reactions: [
      { emoji: E[0], count: 12, mine: false },
      { emoji: E[3], count: 8, mine: true },
      { emoji: E[5], count: 5 },
    ],
    replies: [
      {
        author: {
          name: "Priya Sharma",
          avatar: "PS",
          role: "builder",
          title: "Solo Builder",
          company: "ShipFast Labs",
          companyColor: "#7C3AED",
        },
        content:
          "Multi-repo is huge. We have 12 repos at ShipFast and context switching between them is painful. Will try this today.",
        time: "1h ago",
        reactions: [{ emoji: E[4], count: 3 }],
      },
      {
        author: {
          name: "Arjun Mehta",
          avatar: "AM",
          role: "builder",
          isCreator: true,
          title: "CTO",
          company: "ContextPilot",
          companyColor: "#2255CC",
        },
        content:
          "Let me know how it goes! We optimized for exactly that use case. The cross-repo references were the trickiest part.",
        time: "45m ago",
        reactions: [{ emoji: E[8], count: 2 }],
      },
    ],
  },
  {
    id: "t2",
    author: {
      name: "Sneha Iyer",
      avatar: "SI",
      role: "builder",
      rep: 612,
      title: "AI/ML Lead",
      company: "NeuralDocs",
      companyColor: "#059669",
    },
    content:
      "Hot take: Most AI wrappers fail because they don't solve the 'last mile' problem. Your AI can understand docs perfectly, but if the answer isn't formatted for the user's context, it's useless. That's what we're obsessing over at NeuralDocs.",
    time: "5h ago",
    reactions: [
      { emoji: E[2], count: 15 },
      { emoji: E[3], count: 9, mine: true },
      { emoji: E[9], count: 7 },
    ],
    replies: [
      {
        author: {
          name: "Vikram Singh",
          avatar: "VS",
          role: "builder",
          title: "Lead",
          company: "DevFlow",
          companyColor: "#2563EB",
        },
        content:
          "100% agree. We had the same insight with DevFlow \u2014 generating YAML is easy, generating YAML that works in YOUR specific setup is the hard part.",
        time: "4h ago",
        reactions: [
          { emoji: E[8], count: 4 },
          { emoji: E[0], count: 2 },
        ],
      },
    ],
  },
  {
    id: "t3",
    author: {
      name: "Karan Patel",
      avatar: "KP",
      role: "founder",
      rep: 534,
      title: "Founder",
      company: "QuickLaunch",
      companyColor: "#DC2626",
    },
    content:
      "Milestone: QuickLaunch hit 780 users and $1,400 MRR this week. All from the GrowthX community and word of mouth. Zero paid acquisition. The buildathon demo was our entire launch strategy.",
    time: "1d ago",
    reactions: [
      { emoji: E[1], count: 18, mine: true },
      { emoji: E[0], count: 11 },
      { emoji: E[3], count: 7 },
      { emoji: E[6], count: 3 },
    ],
    replies: [
      {
        author: {
          name: "Aditya Joshi",
          avatar: "AJ",
          role: "founder",
          title: "Founder",
          company: "LaunchPad",
          companyColor: "#B45309",
        },
        content:
          "This is inspiring. Proves that building for a community you're part of is the best GTM strategy. Congrats Karan!",
        time: "20h ago",
        reactions: [
          { emoji: E[4], count: 5 },
          { emoji: E[9], count: 3 },
        ],
      },
      {
        author: {
          name: "Deepa Nair",
          avatar: "DN",
          role: "host",
          title: "Chapter Lead",
          company: "GrowthX",
          companyColor: "#B8962E",
        },
        content:
          "Love seeing buildathon projects turn into real businesses. This is exactly why we run these events. \u{2764}\u{FE0F}",
        time: "18h ago",
        reactions: [{ emoji: E[10], count: 4 }],
      },
    ],
  },
  {
    id: "t4",
    author: {
      name: "Ananya Reddy",
      avatar: "AR",
      role: "builder",
      rep: 489,
      title: "Creator",
      company: "BuildKit",
      companyColor: "#059669",
    },
    content:
      "Question for builders: How do you handle analytics in component libraries? BuildKit auto-tracks every interaction, but I'm worried about bundle size. Current approach adds ~2KB per component. Too much?",
    time: "8h ago",
    reactions: [
      { emoji: E[7], count: 8 },
      { emoji: E[2], count: 4 },
    ],
    replies: [
      {
        author: {
          name: "Meera Krishnan",
          avatar: "MK",
          role: "builder",
          title: "Developer",
          company: "CodeCraft",
          companyColor: "#7C3AED",
        },
        content:
          "2KB per component is fine if it's tree-shakeable. The real question is: does it add runtime overhead? If tracking is async and batched, users won't notice.",
        time: "6h ago",
        reactions: [
          { emoji: E[8], count: 6 },
          { emoji: E[2], count: 2 },
        ],
      },
    ],
  },
];
