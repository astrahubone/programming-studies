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
              Welcome to Your Study Journey
            </Text>
            <Text size="4" color="gray" style={{ lineHeight: '1.6' }}>
              This is the first step to building a study routine that fits your unique needs and goals. 
              Start by creating your personalized study schedule and take control of your learning path.
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
                  Ready to Get Started?
                </Text>
                <Text size="3" color="gray" style={{ lineHeight: '1.5' }}>
                  Create your customized study schedule based on your subjects, 
                  difficulty levels, and preferred review intervals.
                </Text>
              </Box>

              <Button 
                size="4" 
                onClick={handleCreateSchedule}
                style={{ width: '100%' }}
              >
                <Calendar size={20} />
                Create My Study Schedule
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
              📌 Your personalized roadmap will appear here soon!
            </Text>
          </Box>
        </Flex>
      </Box>
    </Layout>
  );
}