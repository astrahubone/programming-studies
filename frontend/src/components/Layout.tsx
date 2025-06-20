import React from 'react';
import { Flex, Box } from '@radix-ui/themes';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Flex height="100vh">
      <Box style={{ width: '256px', flexShrink: 0 }}>
        <Sidebar />
      </Box>
      <Box flexGrow="1" style={{ overflow: 'auto' }}>
        {children}
      </Box>
    </Flex>
  );
}