export const QUOTES = [
  "You're allowed to bloom at your own pace. 🌸",
  "Small steps every day add up to big glow-ups. ✨",
  "Be the energy you want to attract. 💕",
  "Your softness is your superpower. 🌷",
  "Progress, not perfection, pretty girl. 🦋",
  "You are your own kind of beautiful. 💖",
  "Bloom where you are planted. 🌼",
  "Today is a fresh page — write something lovely. 📖",
  "Drink water, touch grass, romanticize your life. 💧",
  "You can do hard things in cute outfits. 👑",
];

/** Deterministic "quote of the day" so it stays stable all day. */
export function quoteOfTheDay(): string {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
  return QUOTES[seed % QUOTES.length];
}
