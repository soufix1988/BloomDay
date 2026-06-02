import {
  Droplets,
  BookHeart,
  Wallet,
  Smile,
  Flame,
  GlassWater,
  CalendarDays,
  Target,
  type LucideIcon,
} from "lucide-react";

export type ToolStatus = "live" | "soon";

export interface Tool {
  slug: string;
  name: string;
  emoji: string;
  icon: LucideIcon;
  /** Accent color (hex) used for the tool's badge & highlights. */
  accent: string;
  category: string;
  description: string;
  status: ToolStatus;
}

/** The 8 flagship tools — fully built in milestone 1. */
export const tools: Tool[] = [
  {
    slug: "period",
    name: "Period Tracker",
    emoji: "🌸",
    icon: Droplets,
    accent: "#f43f7e",
    category: "Health",
    description: "Log your cycle, predict your next period & ovulation window.",
    status: "live",
  },
  {
    slug: "journal",
    name: "Journal",
    emoji: "📔",
    icon: BookHeart,
    accent: "#a855f7",
    category: "Journaling",
    description: "Pour your heart out with mood-tagged daily entries.",
    status: "live",
  },
  {
    slug: "budget",
    name: "Budget Tracker",
    emoji: "💰",
    icon: Wallet,
    accent: "#22c55e",
    category: "Finance",
    description: "Track income & expenses and watch your balance glow up.",
    status: "live",
  },
  {
    slug: "mood",
    name: "Mood Tracker",
    emoji: "😊",
    icon: Smile,
    accent: "#f59e0b",
    category: "Wellness",
    description: "Check in with your feelings & see beautiful mood trends.",
    status: "live",
  },
  {
    slug: "habits",
    name: "Habit Tracker",
    emoji: "🔥",
    icon: Flame,
    accent: "#ef4444",
    category: "Wellness",
    description: "Build streaks and keep your daily habits on track.",
    status: "live",
  },
  {
    slug: "water",
    name: "Water Tracker",
    emoji: "💧",
    icon: GlassWater,
    accent: "#38bdf8",
    category: "Fitness",
    description: "Stay hydrated, queen — tap a glass and hit your goal.",
    status: "live",
  },
  {
    slug: "planner",
    name: "Planner",
    emoji: "📅",
    icon: CalendarDays,
    accent: "#ec4899",
    category: "Planning",
    description: "Plan your day with tasks, priorities & upcoming events.",
    status: "live",
  },
  {
    slug: "goals",
    name: "Goal Planner",
    emoji: "✨",
    icon: Target,
    accent: "#8b5cf6",
    category: "Career",
    description: "Set goals, track progress and celebrate every milestone.",
    status: "live",
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
