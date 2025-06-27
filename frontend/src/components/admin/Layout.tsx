import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Activity,
  LogOut,
  Home,
  Settings,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { Box, Flex, Text, Button, Separator } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Assinaturas', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Performance', href: '/admin/performance', icon: Activity },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Flex height="100vh">
      <Box style={{ width: '256px', flexShrink: 0, borderRight: '1px solid var(--gray-6)' }}>
        <Box p="4">
          <Flex align="center" gap="2">
            <img src="/src/assets/astrahublogo.webp" style={{ height: '24px', width: '24px' }} />
            <Text size="4" weight="bold">Admin Panel</Text>
          </Flex>
        </Box>

        <Box p="2">
          {/* Student View Link */}
          <Button
            asChild
            variant="ghost"
            color="gray"
            size="2"
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}
          >
            <Link to="/inicio">
              <ArrowLeft size={16} />
              Student View
            </Link>
          </Button>

          <Separator size="4" my="2" />

          <Flex direction="column" gap="1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? "soft" : "ghost"}
                  color={isActive ? "indigo" : "gray"}
                  size="2"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Link to={item.href}>
                    <Icon size={16} />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </Flex>
        </Box>

        <Box p="4" style={{ marginTop: 'auto' }}>
          <Separator size="4" mb="4" />
          <Flex justify="between" align="center" mb="4">
            <Text size="2" color="gray">Tema</Text>
            <ThemeToggle />
          </Flex>
          <Button
            variant="ghost"
            color="gray"
            size="2"
            onClick={handleSignOut}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            Sign out
          </Button>
        </Box>
      </Box>

      <Box flexGrow="1" style={{ overflow: 'auto', backgroundColor: 'var(--gray-2)' }}>
        {children}
      </Box>
    </Flex>
  );
}