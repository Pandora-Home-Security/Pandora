// Mock podaci za Dashboard — zamijenit ce ih pravi API kad backend dobije sensor endpoints.
// Alarmi su privremeno mock; backend ima /api/alarms endpoint koji ce biti spojen u sljedecoj fazi.

export type AlarmType = 'motion' | 'door' | 'temp' | 'connection';

export type MockAlarm = {
  id: string;
  message: string;
  time: string;
  type: AlarmType;
};

export type MockSensor = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export const mockAlarms: MockAlarm[] = [
  { id: '1', message: 'Pokret detektiran - Ulazna vrata', time: 'Prije 5 minuta', type: 'motion' },
  { id: '2', message: 'Vrata otvorena - Garaža', time: 'Prije 23 minute', type: 'door' },
  { id: '3', message: 'Temperatura previsoka - Spremište', time: 'Prije 1 sat', type: 'temp' },
  { id: '4', message: 'Pokret detektiran - Dnevni boravak', time: 'Prije 2 sata', type: 'motion' },
  { id: '5', message: 'Gubitak veze - Senzor dvorište', time: 'Prije 3 sata', type: 'connection' },
];

export const mockSensors: MockSensor[] = [
  { id: '1', name: 'Vrata - Ulaz', status: 'active' },
  { id: '2', name: 'Prozor - Dnevni boravak', status: 'active' },
  { id: '3', name: 'Temperatura - Spremište', status: 'active' },
  { id: '4', name: 'Dim - Kuhinja', status: 'active' },
  { id: '5', name: 'Vrata - Garaža', status: 'inactive' },
  { id: '6', name: 'Pokret - Dvorište', status: 'inactive' },
];

export const alarmTypeBadge: Record<AlarmType, { label: string; color: string }> = {
  motion: { label: 'MOT', color: '#d4a853' },
  door: { label: 'DOR', color: '#5fa8d3' },
  temp: { label: 'TMP', color: '#e54d4d' },
  connection: { label: 'CON', color: '#a878d4' },
};

// Mock unread alarm count za navigaciju badge — zamijenit ce ga real-time count iz NotificationsContext
export const mockUnreadCount = 5;
