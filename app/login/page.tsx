'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Login form submitted');
    console.log('📝 Form data:', { id, password: password ? '***' : 'undefined' });
    console.log('📏 ID length:', id?.length || 0);
    console.log('📏 Password length:', password?.length || 0);
    
    setIsLoading(true);
    setError('');

    try {
      const success = await login(id, password);
      console.log('🔐 Login result:', success);
      if (success) {
        console.log('✅ Login successful, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('❌ Login failed, showing error message');
        setError('IDまたはパスワードが正しくありません。');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-text mb-2">
            スピーク管理画面
          </h1>
          <p className="text-dark-text-secondary">
            キャンペーン管理にログインしてください
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-dark-text mb-2">
                キャンペーンID
              </label>
              <input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="input w-full"
                placeholder="キャンペーンIDを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="パスワードを入力"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border">
            <p className="text-sm text-dark-text-secondary mb-4">デモアカウント:</p>
            <div className="space-y-2 text-xs text-dark-text-secondary">
              <div className="flex justify-between">
                <span>インフルエンサー:</span>
                <span>actre_vlog_yt / password</span>
              </div>
              <div className="flex justify-between">
                <span>インフルエンサー:</span>
                <span>eigatube_yt / password</span>
              </div>
              <div className="flex justify-between">
                <span>管理者:</span>
                <span>admin / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
