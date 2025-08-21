'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error boundary caught an error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 12 }}>エラーが発生しました</h2>
          <p style={{ marginBottom: 16 }}>ページの読み込み中に問題が発生しました。再読み込みをお試しください。</p>
          <button onClick={() => reset()} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff' }}>
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}


