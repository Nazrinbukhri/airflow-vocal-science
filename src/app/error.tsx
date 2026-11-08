'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** Shown if a page crashes. The learner's saved progress is not affected. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="font-display text-3xl text-gold-300">Maaf, ada ralat.</p>
      <p className="mt-2 text-charcoal-200">
        Halaman ini menghadapi masalah. Kemajuan anda tetap selamat kerana ia disimpan pada peranti ini.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="min-h-11 rounded-lg bg-gold-500 px-4 font-semibold text-charcoal-950">
          Cuba lagi
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-charcoal-600 px-4 text-charcoal-100">
          Papan Utama
        </Link>
      </div>
    </div>
  );
}
