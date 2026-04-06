import { Container, Title, Text, Card, Stack, Group } from '@mantine/core';
import { IconUser, IconUsers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useRoleStore } from '../stores/useRoleStore';

export const HomePage = () => {
  const navigate = useNavigate();
  const { setRole } = useRoleStore();

  const handleOwnerSelect = () => {
    setRole('owner');
    navigate('/owner');
  };

  const handleGuestSelect = () => {
    setRole('guest');
    navigate('/book');
  };

  return (
    <Container size="md" py={100}>
      <Stack gap="xl" align="center">
        <Stack gap="xs" align="center">
          <Title order={1}>Welcome to Call Calendar</Title>
          <Text c="dimmed" size="lg" ta="center">
            Schedule and manage your meetings with ease
          </Text>
        </Stack>

        <Text fw={500} size="lg">
          I am a...
        </Text>

        <Group gap="lg">
          <Card
            withBorder
            padding="xl"
            radius="md"
            style={{ cursor: 'pointer', width: 200 }}
            onClick={handleOwnerSelect}
            className="hover-card"
          >
            <Stack align="center" gap="md">
              <IconUser size={48} color="var(--mantine-color-blue-6)" />
              <Stack gap={4} align="center">
                <Text fw={600} size="lg">Calendar Owner</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Manage event types and view bookings
                </Text>
              </Stack>
            </Stack>
          </Card>

          <Card
            withBorder
            padding="xl"
            radius="md"
            style={{ cursor: 'pointer', width: 200 }}
            onClick={handleGuestSelect}
            className="hover-card"
          >
            <Stack align="center" gap="md">
              <IconUsers size={48} color="var(--mantine-color-green-6)" />
              <Stack gap={4} align="center">
                <Text fw={600} size="lg">Guest</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Book a meeting with the calendar owner
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Group>
      </Stack>
    </Container>
  );
};
