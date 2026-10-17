import type { ConnectionState, DeviceInfo, FileTransferItem, Message, SignalingPayload } from '../types/linkpair';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

const CHUNK_SIZE = 64 * 1024; // 64 KB

export class LinkPairConnection {
  public peerConnection: RTCPeerConnection | null = null;
  public dataChannel: RTCDataChannel | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  
  public connectionState: ConnectionState = 'disconnected';
  public myId: string;
  public targetPin: string = '';
  public latencyMs: number = 0;
  public peerDeviceInfo: DeviceInfo | null = null;

  private broadcastChannel: BroadcastChannel | null = null;
  private pingInterval: any = null;
  private incomingFiles: Map<string, {
    metadata: { id: string; name: string; size: number; type: string };
    chunks: ArrayBuffer[];
    receivedBytes: number;
    startTime: number;
  }> = new Map();

  // Callbacks
  public onStateChange?: (state: ConnectionState) => void;
  public onMessage?: (msg: Message) => void;
  public onFileProgress?: (item: FileTransferItem) => void;
  public onFileReceived?: (item: FileTransferItem) => void;
  public onRemoteStream?: (stream: MediaStream | null) => void;
  public onLatencyUpdate?: (ms: number) => void;
  public onDeviceInfo?: (info: DeviceInfo) => void;

  constructor() {
    this.myId = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('linkpair_signaling_channel');
        this.broadcastChannel.onmessage = (event) => this.handleSignalingMessage(event.data);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  public getMyDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      name: isMobile ? 'Android / Mobilgerät' : 'Desktop / PC',
      platform: navigator.platform || 'Unknown',
      browser,
      isMobile,
      avatarColor
    };
  }

  public async initConnection(isInitiator: boolean, targetPin: string): Promise<string> {
    this.targetPin = targetPin;
    this.setState('connecting');

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        this.setState('connected');
        this.startPing();
      } else if (state === 'disconnected' || state === 'failed') {
        this.setState('failed');
      } else if (state === 'closed') {
        this.setState('closed');
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(this.remoteStream);
      }
    };

    if (isInitiator) {
      this.dataChannel = this.peerConnection.createDataChannel('linkpair_data', {
        ordered: true
      });
      this.setupDataChannel(this.dataChannel);

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Collect ICE candidates and generate package
      const sdpString = await this.waitForIceCandidates();

      // Broadcast on local channel
      this.broadcast({
        type: 'offer',
        sdp: this.peerConnection.localDescription || undefined,
        senderId: this.myId,
        targetCode: targetPin,
        deviceInfo: this.getMyDeviceInfo()
      });

      return sdpString;
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
      return '';
    }
  }

  public async handleOfferToken(offerToken: string): Promise<string> {
    try {
      const data = JSON.parse(atob(offerToken));
      if (!this.peerConnection) {
        await this.initConnection(false, this.targetPin);
      }
      if (data.deviceInfo) {
        this.peerDeviceInfo = data.deviceInfo;
        this.onDeviceInfo?.(data.deviceInfo);
      }

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      const sdpAnswer = await this.waitForIceCandidates();

      this.broadcast({
        type: 'answer',
        sdp: this.peerConnection!.localDescription || undefined,
        senderId: this.myId,
        targetCode: this.targetPin,
        deviceInfo: this.getMyDeviceInfo()
      });

      return sdpAnswer;
    } catch (e) {
      console.error('Failed to parse offer token:', e);
      throw e;
    }
  }

  public async handleAnswerToken(answerToken: string): Promise<void> {
    try {
      const data = JSON.parse(atob(answerToken));
      if (data.deviceInfo) {
        this.peerDeviceInfo = data.deviceInfo;
        this.onDeviceInfo?.(data.deviceInfo);
      }
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    } catch (e) {
      console.error('Failed to parse answer token:', e);
      throw e;
    }
  }

  private waitForIceCandidates(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.peerConnection) return resolve('');
      
      const checkCandidate = () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          resolve(btoa(JSON.stringify({
            sdp: this.peerConnection.localDescription,
            deviceInfo: this.getMyDeviceInfo()
          })));
        }
      };

      if (this.peerConnection.iceGatheringState === 'complete') {
        checkCandidate();
      } else {
        this.peerConnection.onicecandidate = (event) => {
          if (!event.candidate) {
            resolve(btoa(JSON.stringify({
              sdp: this.peerConnection?.localDescription,
              deviceInfo: this.getMyDeviceInfo()
            })));
          }
        };
        // Safety timeout 1500ms
        setTimeout(() => {
          resolve(btoa(JSON.stringify({
            sdp: this.peerConnection?.localDescription,
            deviceInfo: this.getMyDeviceInfo()
          })));
        }, 1500);
      }
    });
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.setState('connected');
      this.sendMessage('__DEVICE_INFO__:' + JSON.stringify(this.getMyDeviceInfo()));
      this.startPing();
    };

    channel.onclose = () => {
      this.setState('closed');
      this.stopPing();
    };

    channel.onerror = (e) => {
      console.error('DataChannel error:', e);
      this.setState('failed');
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        this.handleStringMessage(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        this.handleBinaryMessage(event.data);
      }
    };
  }

  private handleStringMessage(raw: string) {
    if (raw.startsWith('__PING__:')) {
      const time = raw.split(':')[1];
      this.dataChannel?.send(`__PONG__:${time}`);
      return;
    }
    if (raw.startsWith('__PONG__:')) {
      const sentTime = Number(raw.split(':')[1]);
      this.latencyMs = Math.max(1, Date.now() - sentTime);
      this.onLatencyUpdate?.(this.latencyMs);
      return;
    }
    if (raw.startsWith('__DEVICE_INFO__:')) {
      try {
        const info = JSON.parse(raw.replace('__DEVICE_INFO__:', ''));
        this.peerDeviceInfo = info;
        this.onDeviceInfo?.(info);
      } catch (e) {}
      return;
    }
    if (raw.startsWith('__FILE_START__:')) {
      try {
        const metadata = JSON.parse(raw.replace('__FILE_START__:', ''));
        this.incomingFiles.set(metadata.id, {
          metadata,
          chunks: [],
          receivedBytes: 0,
          startTime: Date.now()
        });
        this.onFileProgress?.({
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          type: metadata.type,
          sender: 'peer',
          progress: 0,
          speed: '0 KB/s',
          status: 'transferring'
        });
      } catch (e) {}
      return;
    }

    try {
      const msg: Message = JSON.parse(raw);
      msg.sender = 'peer';
      this.onMessage?.(msg);
    } catch {
      this.onMessage?.({
        id: Math.random().toString(),
        sender: 'peer',
        text: raw,
        timestamp: Date.now()
      });
    }
  }

  private handleBinaryMessage(buffer: ArrayBuffer) {
    // Structure: [36 bytes UUID][binary payload]
    const decoder = new TextDecoder();
    const id = decoder.decode(buffer.slice(0, 36)).trim();
    const chunkData = buffer.slice(36);

    const file = this.incomingFiles.get(id);
    if (!file) return;

    file.chunks.push(chunkData);
    file.receivedBytes += chunkData.byteLength;

    const progress = Math.min(100, Math.round((file.receivedBytes / file.metadata.size) * 100));
    const elapsedSeconds = Math.max(0.1, (Date.now() - file.startTime) / 1000);
    const kbPerSec = Math.round(file.receivedBytes / 1024 / elapsedSeconds);
    const speed = kbPerSec > 1024 ? `${(kbPerSec / 1024).toFixed(1)} MB/s` : `${kbPerSec} KB/s`;

    const item: FileTransferItem = {
      id: file.metadata.id,
      name: file.metadata.name,
      size: file.metadata.size,
      type: file.metadata.type,
      sender: 'peer',
      progress,
      speed,
      status: progress >= 100 ? 'completed' : 'transferring'
    };

    this.onFileProgress?.(item);

    if (file.receivedBytes >= file.metadata.size) {
      const blob = new Blob(file.chunks, { type: file.metadata.type || 'application/octet-stream' });
      item.blob = blob;
      item.url = URL.createObjectURL(blob);
      item.status = 'completed';
      this.onFileReceived?.(item);
      this.incomingFiles.delete(id);
    }
  }

  public sendMessage(text: string, type: 'text' | 'clipboard' | 'system' = 'text'): Message | null {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return null;
    }
    const msg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'me',
      text,
      timestamp: Date.now(),
      type
    };
    this.dataChannel.send(JSON.stringify(msg));
    return msg;
  }

  public async sendFile(file: File, onProgressUpdate?: (item: FileTransferItem) => void): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('DataChannel not open');
    }

    const id = (Math.random().toString(36) + '000000000000000000000000000000000000').substring(2, 38);
    const metadata = {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream'
    };

    // Send metadata header
    this.dataChannel.send(`__FILE_START__:${JSON.stringify(metadata)}`);

    const item: FileTransferItem = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      sender: 'me',
      progress: 0,
      speed: '0 KB/s',
      status: 'transferring'
    };

    const startTime = Date.now();
    let sentBytes = 0;
    const arrayBuffer = await file.arrayBuffer();

    const idBytes = new TextEncoder().encode(id.padEnd(36, ' '));

    for (let offset = 0; offset < arrayBuffer.byteLength; offset += CHUNK_SIZE) {
      const slice = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
      const combined = new Uint8Array(36 + slice.byteLength);
      combined.set(idBytes, 0);
      combined.set(new Uint8Array(slice), 36);

      // Buffer management
      while (this.dataChannel.bufferedAmount > 8 * 1024 * 1024) {
        await new Promise((r) => setTimeout(r, 20));
      }

      this.dataChannel.send(combined.buffer);
      sentBytes += slice.byteLength;

      const progress = Math.min(100, Math.round((sentBytes / file.size) * 100));
      const elapsedSeconds = Math.max(0.1, (Date.now() - startTime) / 1000);
      const kbPerSec = Math.round(sentBytes / 1024 / elapsedSeconds);
      item.progress = progress;
      item.speed = kbPerSec > 1024 ? `${(kbPerSec / 1024).toFixed(1)} MB/s` : `${kbPerSec} KB/s`;
      
      onProgressUpdate?.(item);
      this.onFileProgress?.(item);
    }

    item.status = 'completed';
    onProgressUpdate?.(item);
    this.onFileProgress?.(item);
  }

  // Media Call Handlers
  public async startMediaCall(audioOnly: boolean = false): Promise<MediaStream> {
    if (!this.peerConnection) throw new Error('No peer connection');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: !audioOnly
    });
    this.localStream = stream;

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    // Renegotiate
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.broadcast({
      type: 'offer',
      sdp: this.peerConnection.localDescription || undefined,
      senderId: this.myId,
      targetCode: this.targetPin
    });

    return stream;
  }

  public endMediaCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.onRemoteStream?.(null);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.dataChannel?.readyState === 'open') {
        this.dataChannel.send(`__PING__:${Date.now()}`);
      }
    }, 3000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private broadcast(payload: SignalingPayload) {
    try {
      this.broadcastChannel?.postMessage(payload);
    } catch (e) {}
  }

  private async handleSignalingMessage(payload: SignalingPayload) {
    if (payload.senderId === this.myId) return;
    if (this.targetPin && payload.targetCode !== this.targetPin) return;

    if (payload.type === 'offer' && payload.sdp && !this.peerConnection) {
      await this.initConnection(false, payload.targetCode);
      if (payload.deviceInfo) {
        this.peerDeviceInfo = payload.deviceInfo;
        this.onDeviceInfo?.(payload.deviceInfo);
      }
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.broadcast({
        type: 'answer',
        sdp: this.peerConnection!.localDescription || undefined,
        senderId: this.myId,
        targetCode: payload.targetCode,
        deviceInfo: this.getMyDeviceInfo()
      });
    } else if (payload.type === 'answer' && payload.sdp && this.peerConnection) {
      if (payload.deviceInfo) {
        this.peerDeviceInfo = payload.deviceInfo;
        this.onDeviceInfo?.(payload.deviceInfo);
      }
      if (this.peerConnection.signalingState !== 'stable') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    }
  }

  private setState(state: ConnectionState) {
    this.connectionState = state;
    this.onStateChange?.(state);
  }

  public disconnect() {
    this.stopPing();
    this.endMediaCall();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.setState('disconnected');
    this.peerDeviceInfo = null;
  }
}
