import type { IconName } from '@/components/ui/Icon';

export type NavItem = {
  href: string;
  label: string;
  /** Short label for the mobile bottom bar. */
  short: string;
  labelEn: string;
  icon: IconName;
  /** Phase in which the module's main feature is delivered. */
  phase: number;
  description: string;
  /** What is already usable before the module's main phase lands. */
  availableNow?: string;
};

/** The latest phase that has been delivered. Used for "ready / coming" badges. */
export const CURRENT_PHASE = 3;

export const NAV: NavItem[] = [
  { href: '/', short: 'Utama', label: 'Papan Utama', labelEn: 'Dashboard', icon: 'home', phase: 1, description: 'Ringkasan kemajuan dan sambung belajar.' },
  { href: '/learn', short: 'Belajar', label: 'Mula Belajar', labelEn: 'Start Learning', icon: 'route', phase: 1, description: 'Program 48 jam, sesi demi sesi.' },
  { href: '/fundamentals', short: 'Asas', label: 'Asas Catur', labelEn: 'Chess Fundamentals', icon: 'book', phase: 5, description: 'Papan, buah catur dan peraturan dari sifar.', availableNow: 'Penjelajah buah catur' },
  { href: '/openings', short: 'Pembukaan', label: 'Akademi Pembukaan', labelEn: 'Opening Academy', icon: 'flag', phase: 6, description: 'Italian Game, Sicilian dan King’s Indian.' },
  { href: '/tactics', short: 'Taktik', label: 'Taktik Agresif', labelEn: 'Aggressive Tactics', icon: 'bolt', phase: 7, description: 'Fork, pin, skewer, pengorbanan dan corak mat.' },
  { href: '/formations', short: 'Formasi', label: 'Perpustakaan Formasi', labelEn: 'Formation Library', icon: 'grid', phase: 7, description: 'Struktur Pion dan cara menyerangnya.' },
  { href: '/prediction', short: 'Ramalan', label: 'Ramalan AI', labelEn: 'AI Prediction', icon: 'spark', phase: 4, description: 'Langkah calon Stockfish dengan penjelasan.' },
  { href: '/play', short: 'Main', label: 'Lawan AI', labelEn: 'Play Against AI', icon: 'play', phase: 3, description: 'Main lawan Stockfish pada 8 tahap, atau mod dua pemain.' },
  { href: '/masterclass', short: 'GM', label: 'Kelas Grandmaster', labelEn: 'Grandmaster Masterclass', icon: 'crown', phase: 8, description: 'Permainan serangan Tal, Kasparov, Polgár dan lain-lain.' },
  { href: '/analysis', short: 'Analisis', label: 'Analisis Permainan', labelEn: 'Game Analysis', icon: 'chart', phase: 8, description: 'Semak permainan dengan enjin: kesilapan, blunder, ketepatan.', availableNow: 'Import PGN/FEN' },
  { href: '/progress', short: 'Kemajuan', label: 'Kemajuan Saya', labelEn: 'My Progress', icon: 'trophy', phase: 1, description: 'Sesi selesai, masa belajar dan laporan.' },
];

/** Shown directly in the mobile bottom bar; the rest live under "Lagi". */
export const MOBILE_PRIMARY = ['/', '/learn', '/tactics', '/play'];

export function isActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return href === '/' ? p === '/' : p === href || p.startsWith(`${href}/`);
}
