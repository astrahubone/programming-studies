import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Flex, Text, TextField, Button, Card, Callout } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, disconnect, session, isAdmin } = useAuth();

  useEffect(() => {
    if (session) {
      console.log('Session detected in Login, redirecting...');
      // Redirect based on user role
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/inicio', { replace: true });
      }
    }
  }, [session, isAdmin, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      console.log('Attempting login...');
      await signIn(email, password);
      
      toast.success('Login realizado com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  }

  // Don't render the login form if user is already authenticated
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
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
                  placeholder="seu@email.com"
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
                  placeholder="Sua senha"
                />
              </Box>

              <Button type="submit" disabled={loading} size="3">
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
            >
              Limpar dados e reconectar
            </Button>
          </Box>
        </Card>
      </Flex>
    </Box>
  );
}