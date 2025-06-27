import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Flex, Text, TextField, Button, Card, Callout } from '@radix-ui/themes';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem');
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password, fullName);
      navigate('/');
    } catch (error) {
      setError('Erro ao criar uma conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Flex direction="column" justify="center" align="center" style={{ minHeight: '100vh' }} p="6">
        <Box mb="6">
          <Flex direction="column" align="center" gap="4">
            <img src="/src/assets/astrahublogo.webp" style={{ height: '128px', width: '128px' }} />
            <Text size="6" weight="bold">Crie sua conta</Text>
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
                  Nome completo
                </Text>
                <TextField.Root
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  size="3"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Endereço de email
                </Text>
                <TextField.Root
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="3"
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
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Confirme a senha
                </Text>
                <TextField.Root
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  size="3"
                />
              </Box>

              <Button type="submit" disabled={loading} size="3">
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </Flex>
          </form>

          <Box mt="6">
            <Text size="2" color="gray" align="center" style={{ display: 'block' }}>
              Já tem uma conta?{' '}
              <Link to="/login" style={{ color: 'var(--accent-9)' }}>
                Entrar
              </Link>
            </Text>
          </Box>
        </Card>
      </Flex>
    </Box>
  );
}