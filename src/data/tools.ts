import {
  GlassWater, Footprints, Dumbbell, Moon, Droplets, Pill,
  Smile, Heart, BookHeart, Wind, Sparkles,
  CalendarDays, Flame, Target, ListTodo, BookOpen,
  Wallet, CreditCard, PiggyBank, Trophy, Receipt, Bell,
  Flower2, Palette, Shirt, Star, CalendarHeart,
  ShoppingCart, UtensilsCrossed, ChefHat, Gift,
  type LucideIcon,
} from "lucide-react";

export type ToolStatus = "live" | "soon";

export interface ToolCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface Tool {
  slug: string;
  name: string;
  emoji: string;
  icon: LucideIcon;
  accent: string;
  categoryId: string;
  description: string;
  status: ToolStatus;
  pro?: boolean;
}

export const categories: ToolCategory[] = [
  { id: "body",    name: "Body & Glow",        emoji: "🌷" },
  { id: "mind",    name: "Mind & Mood",         emoji: "💗" },
  { id: "money",   name: "Money",               emoji: "💰" },
  { id: "plan",    name: "Planning",            emoji: "✅" },
  { id: "style",   name: "Self-care & Style",   emoji: "💅" },
  { id: "home",    name: "Home & Kitchen",      emoji: "🏡" },
];

export const tools: Tool[] = [
  // ── Body & Glow ──
  { slug: "water",    name: "Sip",      emoji: "💧", icon: GlassWater, accent: "#5cb8e0", categoryId: "body",  description: "Track your daily water glow.",        status: "live" },
  { slug: "steps",    name: "Steps",    emoji: "👟", icon: Footprints, accent: "#7cc77c", categoryId: "body",  description: "Count your little wanders.",          status: "soon" },
  { slug: "move",     name: "Move",     emoji: "🧘", icon: Dumbbell,   accent: "#ec7aa0", categoryId: "body",  description: "Gentle workouts & stretches.",        status: "soon" },
  { slug: "rest",     name: "Rest",     emoji: "🌙", icon: Moon,       accent: "#9b8ad8", categoryId: "body",  description: "Sleep softly, wake glowing.",         status: "soon" },
  { slug: "period",   name: "Cycle",    emoji: "🌸", icon: Droplets,   accent: "#ec6f9e", categoryId: "body",  description: "Follow your monthly rhythm.",         status: "live", pro: true },
  { slug: "vitamins", name: "Vitamins", emoji: "💊", icon: Pill,       accent: "#efaa5a", categoryId: "body",  description: "Never miss your daily dose.",         status: "soon" },

  // ── Mind & Mood ──
  { slug: "mood",        name: "Mood",        emoji: "😊", icon: Smile,     accent: "#efb24d", categoryId: "mind",  description: "Check in with your feelings.",    status: "live" },
  { slug: "gratitude",   name: "Gratitude",   emoji: "🤍", icon: Heart,     accent: "#ec7aa0", categoryId: "mind",  description: "Three sweet things daily.",       status: "soon" },
  { slug: "journal",     name: "Journal",     emoji: "📔", icon: BookHeart, accent: "#a87ad8", categoryId: "mind",  description: "Pour your heart on paper.",       status: "live" },
  { slug: "breathe",     name: "Breathe",     emoji: "🌬️", icon: Wind,      accent: "#5cc0cc", categoryId: "mind",  description: "Calm breaths, soft mind.",        status: "soon" },
  { slug: "affirmation", name: "Affirmation", emoji: "✨", icon: Sparkles,  accent: "#e88ac0", categoryId: "mind",  description: "Daily words of love.",            status: "soon" },

  // ── Money ──
  { slug: "budget",    name: "Budget",    emoji: "💰", icon: Wallet,      accent: "#5cb874", categoryId: "money", description: "Plan your pretty pennies.",        status: "live" },
  { slug: "spending",  name: "Spending",  emoji: "🧾", icon: CreditCard,  accent: "#efb24d", categoryId: "money", description: "See where it all goes.",           status: "soon" },
  { slug: "savings",   name: "Savings",   emoji: "🐷", icon: PiggyBank,   accent: "#7cc77c", categoryId: "money", description: "Grow your little fund.",           status: "soon" },
  { slug: "challenge", name: "Challenge", emoji: "🏆", icon: Trophy,      accent: "#ef9a4d", categoryId: "money", description: "30-day savings stretch.",          status: "soon", pro: true },
  { slug: "subs",      name: "Subs",      emoji: "📱", icon: Receipt,     accent: "#ec6f9e", categoryId: "money", description: "Track your subscriptions.",        status: "soon" },
  { slug: "bills",     name: "Bills",     emoji: "🗓️", icon: Bell,        accent: "#9b8ad8", categoryId: "money", description: "Never miss a due date.",           status: "soon" },

  // ── Planning ──
  { slug: "todo",    name: "To-do",   emoji: "☑️", icon: ListTodo,    accent: "#ec7aa0", categoryId: "plan",  description: "Capture every little thing.",     status: "soon" },
  { slug: "planner", name: "Planner", emoji: "📅", icon: CalendarDays,accent: "#ec6f9e", categoryId: "plan",  description: "Plan your softest day.",          status: "live" },
  { slug: "habits",  name: "Habits",  emoji: "🔥", icon: Flame,       accent: "#ef7a6f", categoryId: "plan",  description: "Build streaks, gently.",          status: "live" },
  { slug: "goals",   name: "Goals",   emoji: "🎯", icon: Target,      accent: "#9b7ad8", categoryId: "plan",  description: "Dream it, track it, bloom.",      status: "live" },
  { slug: "reads",   name: "Reads",   emoji: "📚", icon: BookOpen,    accent: "#5cb8e0", categoryId: "plan",  description: "Your reading list, prettified.",  status: "soon" },

  // ── Self-care & Style ──
  { slug: "skincare",    name: "Skincare",     emoji: "🧴", icon: Flower2,      accent: "#ec7aa0", categoryId: "style", description: "Your glow-up routine.",           status: "soon" },
  { slug: "colors",      name: "Colors",       emoji: "🎨", icon: Palette,      accent: "#a87ad8", categoryId: "style", description: "Discover your color season.",     status: "soon" },
  { slug: "outfits",     name: "Outfits",      emoji: "👗", icon: Shirt,        accent: "#efb24d", categoryId: "style", description: "Style your wardrobe.",            status: "soon" },
  { slug: "visionboard", name: "Vision Board", emoji: "🌟", icon: Star,         accent: "#ef9a4d", categoryId: "style", description: "Pin your dream life.",            status: "soon", pro: true },
  { slug: "dates",       name: "Dates",        emoji: "💌", icon: CalendarHeart,accent: "#ec6f9e", categoryId: "style", description: "Plan sweet moments.",             status: "soon" },

  // ── Home & Kitchen ──
  { slug: "grocery",  name: "Grocery List",  emoji: "🛒", icon: ShoppingCart,  accent: "#7cc77c", categoryId: "home",  description: "Never forget a thing.",           status: "soon" },
  { slug: "meals",    name: "Meal Planner",  emoji: "🍽️", icon: UtensilsCrossed, accent: "#efaa5a", categoryId: "home", description: "Eat soft, live sweet.",          status: "soon" },
  { slug: "recipes",  name: "Recipe Saver",  emoji: "👩‍🍳", icon: ChefHat,      accent: "#ec7aa0", categoryId: "home",  description: "Keep your fave recipes.",        status: "soon" },
  { slug: "giftbudget", name: "Gift Budget", emoji: "🎁", icon: Gift,          accent: "#a87ad8", categoryId: "home",  description: "Thoughtful gifts, happy wallet.", status: "soon" },
];

export const liveTools = tools.filter((t) => t.status === "live");
export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const toolsByCategory = (categoryId: string) =>
  tools.filter((t) => t.categoryId === categoryId);
