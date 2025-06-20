import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Settings, BarChart2, LogOut, LayoutDashboard } from 'lucide-react';
import { Box, Flex, Text, Button, Separator } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

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
    <Flex direction="column" height="100vh" style={{ borderRight: '1px solid var(--gray-6)' }}>
      <Box p="4">
        <Flex align="center" gap="2">
          <img src='src\assets\logoblack.png' style={{ height: '32px', width: '32px' }} />
          <Text size="4" weight="bold">MedStudy</Text>
        </Flex>
      </Box>
      
      <Box flexGrow="1" p="2">
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

          {/* Admin Dashboard Link - Only visible for admin users */}
          {isAdmin && (
            <Button
              asChild
              variant={location.pathname.startsWith('/admin') ? "soft" : "ghost"}
              color={location.pathname.startsWith('/admin') ? "purple" : "gray"}
              size="2"
              style={{ justifyContent: 'flex-start' }}
            >
              <Link to="/admin">
                <LayoutDashboard size={16} />
                Admin Dashboard
              </Link>
            </Button>
          )}
        </Flex>
      </Box>
      
      <Box p="4">
        <Separator size="4" mb="4" />
        <Flex justify="between" align="center" mb="4">
          <Text size="2" color="gray">Tema</Text>
          <ThemeToggle />
        </Flex>
        <Button
          variant="ghost"
          color="gray"
          size="2"
          onClick={() => signOut()}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </Box>
    </Flex>
  );
}