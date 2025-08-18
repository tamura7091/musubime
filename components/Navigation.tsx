'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-dark-surface border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <svg width="50" height="34" viewBox="0 0 79 54" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.336003 21.837C0.473334 19.9019 1.33932 18.0878 2.76326 16.7524C4.18721 15.417 6.0658 14.657 8.02873 14.6224C12.5922 14.5795 16.0691 18.5089 15.946 23.0466C15.8591 25.5087 15.8591 27.842 15.946 30.3041C16.1561 35.0637 12.5053 39.2508 7.73176 39.2937C5.84288 39.3578 4.00096 38.7043 2.58487 37.4675C1.16878 36.2307 0.286207 34.5047 0.118703 32.6445C-0.0936534 29.0419 -0.0210052 25.4284 0.336003 21.837V21.837Z" fill="white"/>
              <path d="M21.6465 7.15733C22.3709 2.2331 25.5146 1.22176e-05 29.6145 1.22176e-05C30.7269 -0.0018915 31.8282 0.218699 32.852 0.648469C33.8758 1.07824 34.801 1.70832 35.5719 2.50075C36.3427 3.29318 36.9433 4.23156 37.3374 5.2594C37.7315 6.28724 37.9109 7.38327 37.865 8.48146C37.3942 21.5579 37.4376 31.8143 37.9954 45.406C38.162 50.0368 34.2359 54.1666 29.9115 53.9948C26.9634 53.8588 23.653 52.5061 22.4506 49.1422C19.5024 40.761 20.6252 13.9496 21.6465 7.15733Z" fill="white"/>
              <path d="M42.7113 21.0566C42.9934 19.2697 43.9099 17.6402 45.2968 16.46C46.6838 15.2798 48.4505 14.6258 50.2809 14.6151C55.1414 14.5721 58.756 18.9095 58.6256 23.7335C58.5386 25.9076 58.5821 28.0848 58.7559 30.2538C59.0529 35.0134 55.4456 39.2005 50.672 39.2864C48.7806 39.3093 46.944 38.6587 45.4982 37.4536C44.0524 36.2484 43.0939 34.5692 42.7982 32.7231C42.099 28.8674 42.0696 24.9221 42.7113 21.0566V21.0566Z" fill="white"/>
              <path d="M70.2515 19.2465C71.2866 19.206 72.319 19.378 73.2834 19.7518C74.2478 20.1256 75.1232 20.6929 75.8543 21.4181C76.5854 22.1432 77.1564 23.0103 77.5311 23.9645C77.9058 24.9188 78.0761 25.9395 78.0312 26.9621C78.0312 31.6287 74.8223 34.6705 70.2515 34.6705C66.2965 34.6705 63.218 31.8076 63.2687 26.9621C63.3194 22.1166 66.2965 19.2465 70.2515 19.2465Z" fill="white"/>
            </svg>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-dark-accent flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
              <div className="text-sm">
                <p className="text-dark-text font-medium">{user.name}</p>
                <p className="text-dark-text-secondary">
                  {user.role === 'admin' ? '管理者' : 'インフルエンサー'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-dark-text-secondary hover:text-dark-text transition-colors"
              title="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
