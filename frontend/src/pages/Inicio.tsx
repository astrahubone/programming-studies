import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Button, Card } from '@radix-ui/themes';
import { Calendar, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

export default function Inicio() {
  const navigate = useNavigate();

  const handleCreateSchedule = () => {
    navigate('/study-config');
  };

  return (
    <Layout>
      <Box p="6">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Box mb="8" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <Text size="8" weight="bold" mb="4" style={{ display: 'block' }}>
              Bem-vindo à sua Jornada de Estudos
            </Text>
            <Text size="4" color="gray" style={{ lineHeight: '1.6' }}>
              Este é o primeiro passo para construir uma rotina de estudos que se adapta às suas necessidades e objetivos únicos. 
              Comece criando seu cronograma de estudos personalizado e assuma o controle do seu caminho de aprendizado.
            </Text>
          </Box>

          <Card size="4" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
            <Flex direction="column" gap="6" p="4">
              <Box>
                <Flex justify="center" mb="4">
                  <Box 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--indigo-3)',
                      color: 'var(--indigo-11)'
                    }}
                  >
                    <Calendar size={32} />
                  </Box>
                </Flex>
                <Text size="5" weight="medium" mb="3" style={{ display: 'block' }}>
                  Pronto para Começar?
                </Text>
                <Text size="3" color="gray" style={{ lineHeight: '1.5' }}>
                  Crie seu cronograma de estudos personalizado baseado nas suas matérias, 
                  níveis de dificuldade e intervalos de revisão preferidos.
                </Text>
              </Box>

              <Button 
                size="4" 
                onClick={handleCreateSchedule}
                style={{ width: '100%' }}
              >
                <Calendar size={20} />
                Criar Meu Cronograma de Estudos
                <ArrowRight size={20} />
              </Button>
            </Flex>
          </Card>

          <Box mt="8" p="4" style={{ 
            backgroundColor: 'var(--gray-2)', 
            borderRadius: '8px',
            border: '1px dashed var(--gray-6)',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%'
          }}>
            <Text size="3" color="gray">
              📌 Seu roteiro personalizado aparecerá aqui em breve!
            </Text>
          </Box>
        </Flex>
      </Box>
    </Layout>
  );
}