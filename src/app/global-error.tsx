'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error, 'Global Error caught');
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Critical System Failure
          </h2>
          <p className="text-gray-400 mb-6 text-center">
            The simulation has encountered a fatal error.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Attempt Reboot
          </button>
        </div>
      </body>
    </html>
  );
}
