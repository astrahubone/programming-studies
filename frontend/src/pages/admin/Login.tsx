import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text, TextField, Button, Card, Callout } from '@radix-ui/themes';
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, isAdmin, session } = useAuth();

  useEffect(() => {
    if (session && isAdmin) {
      navigate("/admin");
    } else if (session && !isAdmin) {
      navigate("/dashboard");
      toast.error("Acesso restrito. Você não tem permissões de administrador.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }, [session, isAdmin, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      console.error("Error no login:", error);
      toast.error("Credenciais inválidas ou usuário não é administrador", {
        position: "top-right",
        autoClose: 3000,
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

  if (session) {
    return null;
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-2)' }}>
      <Flex direction="column" justify="center" align="center" style={{ minHeight: '100vh' }} p="6">
        <Box mb="6">
          <Flex direction="column" align="center" gap="4">
            <img src='src\assets\logoblack.png' style={{ height: '128px', width: '128px' }} />
            <Text size="6" weight="bold">Admin Login</Text>
          </Flex>
        </Box>

        <Card style={{ width: '100%', maxWidth: '400px' }} size="3">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Email
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

              <Button type="submit" disabled={loading} size="3">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </Flex>
          </form>
        </Card>
      </Flex>
    </Box>
  );
}