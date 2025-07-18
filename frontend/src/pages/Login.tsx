import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Flex, Text, TextField, Button, Card, Callout } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, disconnect, session, isAdmin, user, loading: authLoading } = useAuth();

  // Handle navigation when session/user changes
  useEffect(() => {
    console.log('Login: Auth state changed:', { 
      session: !!session, 
      user: !!user, 
      isAdmin, 
      authLoading 
    });

    // Only redirect if we have both session and user data, and we're not loading
    if (session && user && !authLoading) {
      console.log('Login: All conditions met for redirect, navigating...');
      
      const targetPath = isAdmin ? '/admin' : '/inicio';
      console.log('Login: Redirecting to:', targetPath);
      
      // Use a small delay to ensure everything is properly set
      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 100);
    }
  }, [session, user, isAdmin, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (loading || authLoading) return;
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Login: Starting login process...');
      await signIn(email, password);
      console.log('Login: Sign in completed successfully');
      
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error?.response?.data?.error || error?.message || 'Credenciais inválidas. Verifique seu email e senha.');
    } finally {
      setLoading(false);
    }
  }

  // Show loading state if we have a session but are still loading user data
  if ((session && !user && authLoading) || (session && user && !authLoading)) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
        <Flex direction="column" justify="center" align="center" style={{ minHeight: '100vh' }} p="6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <Text mt="4">Redirecionando...</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Flex direction="column" justify="center" align="center" style={{ minHeight: '100vh' }} p="6">
        <Box mb="6">
          <Flex direction="column" align="center" gap="4">
            <img src="/src/assets/astrahublogo.webp" style={{ height: '128px', width: '128px' }} />
            <Text size="6" weight="bold">Astra Hub</Text>
          </Flex>
        </Box>

        <Card style={{ width: '100%', maxWidth: '400px' }} size="3">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              {error && (
                <Callout.Root color="red">
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}
              
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Endereço de Email
                </Text>
                <TextField.Root
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="3"
                  disabled={loading || authLoading}
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Senha
                </Text>
                <TextField.Root
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="3"
                  disabled={loading || authLoading}
                />
              </Box>

              <Button type="submit" disabled={loading || authLoading} size="3">
                {loading ? 'Fazendo login...' : 'Entrar'}
              </Button>
            </Flex>
          </form>

          <Box mt="6">
            <Text size="2" color="gray" align="center" style={{ display: 'block' }}>
              Ainda não criou uma conta?{' '}
              <Link to="/register" style={{ color: 'var(--accent-9)' }}>
                Cadastre-se
              </Link>
            </Text>
          </Box>

          <Box mt="4">
            <Button
              variant="outline"
              onClick={disconnect}
              size="3"
              style={{ width: '100%' }}
              disabled={loading || authLoading}
            >
              Disconectar
            </Button>
          </Box>
        </Card>
      </Flex>
    </Box>
  );
}