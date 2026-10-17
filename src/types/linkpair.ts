export interface Message {
  id: string;
  sender: 'me' | 'peer';
  text: string;
  timestamp: number;
  type?: 'text' | 'clipboard' | 'system';
}

export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  sender: 'me' | 'peer';
  progress: number; // 0 to 100
  speed: string;
  status: 'pending' | 'transferring' | 'completed' | 'error';
  url?: string;
  blob?: Blob;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'closed';

export interface DeviceInfo {
  name: string;
  platform: string;
  browser: string;
  isMobile: boolean;
  avatarColor: string;
}

export interface SignalingPayload {
  type: 'offer' | 'answer' | 'candidate' | 'ping' | 'pong';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  senderId: string;
  targetCode: string;
  deviceInfo?: DeviceInfo;
}

export interface ApkBuildOptions {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  webUrl: string;
  primaryColor: string;
  themeColor: string;
  includeCameraPermission: boolean;
  includeRecordAudioPermission: boolean;
  includeStoragePermission: boolean;
  buildMode: 'offline-native' | 'web-linked';
  offlineHtmlBundle?: string;
}
