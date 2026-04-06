import { Group, Button, Title, Box } from '@mantine/core';
import { IconCalendar, IconUser, IconUsers } from '@tabler/icons-react';
import { useRoleStore } from '../../stores/useRoleStore';
import type { UserRole } from '../../types';

export const Header = () => {
  const { role, setRole } = useRoleStore();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <Box
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        padding: '16px 24px',
        backgroundColor: 'white',
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconCalendar size={28} color="var(--mantine-color-blue-6)" />
          <Title order={3}>Call Calendar</Title>
        </Group>

        <Group gap="xs">
          <Button
            variant={role === 'owner' ? 'filled' : 'light'}
            leftSection={<IconUser size={16} />}
            onClick={() => handleRoleChange('owner')}
          >
            Owner
          </Button>
          <Button
            variant={role === 'guest' ? 'filled' : 'light'}
            leftSection={<IconUsers size={16} />}
            onClick={() => handleRoleChange('guest')}
          >
            Guest
          </Button>
        </Group>
      </Group>
    </Box>
  );
};
