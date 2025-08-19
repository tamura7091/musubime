'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import speakLogoLight from '@/app/assets/speak_logo_lightmode.svg';
import speakLogoDark from '@/app/assets/speak_logo_darkmode.svg';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const ds = useDesignSystem();

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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ds.bg.primary }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src={ds.resolvedTheme === 'light' ? speakLogoLight.src : speakLogoDark.src} 
              alt="Speak Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: ds.text.primary }}>
            ようこそ！
          </h1>
          <p style={{ color: ds.text.secondary }}>
            スピークのインフルエンサーPR管理画面にログインしてください
          </p>
        </div>

        <div className="rounded-xl p-6" style={{ 
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="id" className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                キャンペーンID
              </label>
              <input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                placeholder="キャンペーンIDを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: ds.text.primary }}>
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: ds.form.input.bg,
                  borderColor: ds.form.input.border,
                  color: ds.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                placeholder="パスワードを入力"
                required
              />
            </div>

            {error && (
              <div className="text-sm rounded-lg p-3" style={{ 
                color: '#f87171',
                backgroundColor: '#ef4444' + '10',
                borderColor: '#ef4444' + '20',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: ds.button.primary.bg,
                color: ds.button.primary.text
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = ds.button.primary.hover)}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = ds.button.primary.bg)}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
