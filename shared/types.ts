// Zajednički tipovi za Pandora projekt

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
}

export interface Alert {
  id: string;
  cameraId: string;
  type: 'motion' | 'sound' | 'offline';
  message: string;
  timestamp: Date;
  isRead: boolean;
}
