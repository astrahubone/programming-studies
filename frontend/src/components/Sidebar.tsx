import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Settings, BarChart2, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import clsx from 'clsx';

const navigation = [
  { name: "Calendário", href: "/dashboard", icon: Calendar },
  { name: "Gerenciador de Matérias", href: "/subjects", icon: BookOpen },
  { name: "Configurações dos Estudos", href: "/study-config", icon: Settings },
  { name: "Performance", href: "/performance", icon: BarChart2 }
];

export default function Sidebar() {
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 px-4">
        <img src='src\assets\logoblack.png' className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
      <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">MedStudy</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                location.pathname === item.href
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
            >
              <Icon
                className={clsx(
                  location.pathname === item.href
                    ? 'text-indigo-600 dark:text-indigo-200'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300',
                  'mr-3 h-5 w-5'
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Dashboard Link - Only visible for admin users */}
        {isAdmin && (
          <Link
            to="/admin"
            className={clsx(
              location.pathname.startsWith('/admin')
                ? 'bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-200'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )}
          >
            <LayoutDashboard
              className={clsx(
                location.pathname.startsWith('/admin')
                  ? 'text-purple-600 dark:text-purple-200'
                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300',
                'mr-3 h-5 w-5'
              )}
            />
            Admin Dashboard
          </Link>
        )}
      </nav>
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
}