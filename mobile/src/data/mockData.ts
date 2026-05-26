// Mock podaci za Dashboard — zamijenit ce ih pravi API kad backend dobije sensor endpoints.
// Alarmi su privremeno mock; backend ima /api/alarms endpoint koji ce biti spojen u sljedecoj fazi.

export type AlarmType = 'motion' | 'door' | 'temp' | 'connection';

export type MockAlarm = {
  id: string;
  message: string;
  time: string;
  type: AlarmType;
};

export type SensorType = 'door' | 'window' | 'smoke' | 'temperature' | 'motion';
export type SensorStatus = 'active' | 'inactive';

export type MockSensor = {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
  lastReading?: string;
};

export const mockAlarms: MockAlarm[] = [
  { id: '1', message: 'Pokret detektiran - Ulazna vrata', time: 'Prije 5 minuta', type: 'motion' },
  { id: '2', message: 'Vrata otvorena - Garaža', time: 'Prije 23 minute', type: 'door' },
  { id: '3', message: 'Temperatura previsoka - Spremište', time: 'Prije 1 sat', type: 'temp' },
  { id: '4', message: 'Pokret detektiran - Dnevni boravak', time: 'Prije 2 sata', type: 'motion' },
  { id: '5', message: 'Gubitak veze - Senzor dvorište', time: 'Prije 3 sata', type: 'connection' },
];

export const sensorTypeLabels: Record<SensorType, string> = {
  door: 'Vrata',
  window: 'Prozor',
  smoke: 'Dim',
  temperature: 'Temperatura',
  motion: 'Pokret',
};

export const sensorTypeColors: Record<SensorType, string> = {
  door: '#34d399',
  window: '#60a5fa',
  smoke: '#9ca3af',
  temperature: '#fb923c',
  motion: '#a78bfa',
};

export const mockSensors: MockSensor[] = [
  { id: '1',  name: 'Senzor ulaznih vrata',      type: 'door',        location: 'Ulaz',           status: 'active',   lastReading: 'Zatvoreno' },
  { id: '2',  name: 'Senzor prozora dnevni',      type: 'window',      location: 'Dnevni boravak', status: 'active',   lastReading: 'Zatvoreno' },
  { id: '3',  name: 'Detektor dima kuhinja',      type: 'smoke',       location: 'Kuhinja',        status: 'active',   lastReading: 'OK' },
  { id: '4',  name: 'Termometar spremiste',        type: 'temperature', location: 'Spremiste',      status: 'active',   lastReading: '22.4 °C' },
  { id: '5',  name: 'Senzor garaznih vrata',       type: 'door',        location: 'Garaza',         status: 'inactive' },
  { id: '6',  name: 'Senzor pokreta dvoriste',     type: 'motion',      location: 'Dvoriste',       status: 'inactive' },
  { id: '7',  name: 'Senzor prozora spavaca',      type: 'window',      location: 'Spavaca soba',   status: 'active',   lastReading: 'Zatvoreno' },
  { id: '8',  name: 'Detektor dima hodnik',        type: 'smoke',       location: 'Hodnik',         status: 'active',   lastReading: 'OK' },
  { id: '9',  name: 'Termometar dnevni boravak',   type: 'temperature', location: 'Dnevni boravak', status: 'active',   lastReading: '23.1 °C' },
  { id: '10', name: 'Senzor pokreta hodnik',       type: 'motion',      location: 'Hodnik',         status: 'active',   lastReading: 'Mirno' },
];

export const alarmTypeBadge: Record<AlarmType, { label: string; color: string }> = {
  motion: { label: 'MOT', color: '#d4a853' },
  door: { label: 'DOR', color: '#5fa8d3' },
  temp: { label: 'TMP', color: '#e54d4d' },
  connection: { label: 'CON', color: '#a878d4' },
};

// Mock unread alarm count za navigaciju badge — zamijenit ce ga real-time count iz NotificationsContext
export const mockUnreadCount = 5;
