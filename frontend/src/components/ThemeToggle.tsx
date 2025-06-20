import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@radix-ui/themes';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="2"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <Moon size={16} />
      ) : (
        <Sun size={16} />
      )}
    </Button>
  );
}