/**
 * Photo registry — single source of truth for imagery across the app.
 *
 * These are remote Pexels URLs (free, no attribution required, hotlink-friendly).
 * To swap any photo: replace its URL below, or drop a local file in src/assets
 * and import it here instead. Everything that uses the photo updates automatically.
 */

const px = (id: number, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const photos = {
  // Cozy woman in a robe with morning coffee
  morning: px(7683712),
  // Woman on a pink yoga mat
  pilates: px(9004267),
  // Pink aesthetic desk flatlay (coffee + camera)
  desk: px(29765800),
  // Cute pink piggy bank
  money: px(4146005),
  // Vibrant pink roses in a garden
  roses: px(34586582),
  // Cozy morning coffee with roses and open book
  ritual: px(30661035),
} as const;

export type PhotoKey = keyof typeof photos;
