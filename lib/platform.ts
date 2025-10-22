export type NormalizedPlatform =
  | 'yt'   // YouTube long
  | 'yts'  // YouTube Shorts
  | 'tw'   // X (Twitter)
  | 'ig'   // Instagram
  | 'tt'   // TikTok
  | 'igr'  // Instagram Reels
  | 'sv'   // Generic short video
  | 'pc'   // Podcast
  | 'vc'   // Voicy
  | 'bl';  // Blog

const platformNormalizationMap: Record<string, NormalizedPlatform> = {
  // YouTube
  yt: 'yt',
  youtube: 'yt',
  youtube_long: 'yt',

  // YouTube Shorts
  yts: 'yts',
  youtube_short: 'yts',
  youtube_shorts: 'yts',

  // X / Twitter
  tw: 'tw',
  twitter: 'tw',
  x: 'tw',
  x_twitter: 'tw',

  // Instagram
  ig: 'ig',
  instagram: 'ig',

  // TikTok
  tt: 'tt',
  tiktok: 'tt',

  // Instagram Reels
  igr: 'igr',
  instagram_reel: 'igr',
  instagram_reels: 'igr',

  // Short video (generic)
  sv: 'sv',
  short_video: 'sv',
  short_videos: 'sv',

  // Podcast
  pc: 'pc',
  podcast: 'pc',
  podcasts: 'pc',

  // Voicy
  vc: 'vc',
  voicy: 'vc',

  // Blog
  bl: 'bl',
  blog: 'bl',
};

export function normalizePlatform(input: string | undefined | null): NormalizedPlatform | undefined {
  if (!input) return undefined;
  const key = String(input).toLowerCase().trim();
  return platformNormalizationMap[key];
}

const japaneseLabelByNormalized: Record<NormalizedPlatform, string> = {
  yt: 'YouTube',
  yts: 'ショート動画',
  tw: 'X（Twitter）',
  ig: 'Instagram',
  tt: 'ショート動画',
  igr: 'ショート動画',
  sv: 'ショート動画',
  pc: 'Podcast',
  vc: 'Voicy',
  bl: 'Blog',
};

export function getPlatformLabel(platform: string | undefined | null): string {
  const normalized = normalizePlatform(platform);
  if (normalized) return japaneseLabelByNormalized[normalized];

  // Fallbacks when unmapped: keep prior heuristics
  const lower = String(platform || '').toLowerCase();
  if (lower.includes('youtube')) return 'YouTube';
  if (['x_twitter', 'twitter', 'tw', 'x'].includes(lower)) return 'X/Twitter';
  if (['instagram', 'ig'].includes(lower)) return 'Instagram';
  if (['tiktok', 'tt'].includes(lower)) return 'ショート動画';
  return platform || 'Unknown';
}

export function isShortVideo(platform: string | undefined | null): boolean {
  const n = normalizePlatform(platform);
  return n === 'yts' || n === 'tt' || n === 'igr' || n === 'sv';
}

