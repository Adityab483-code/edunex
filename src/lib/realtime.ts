import { Message } from "../types";

export type RealtimeStatus = "connected" | "connecting" | "disconnected" | "error";

export interface TypingEvent {
  senderId: string;
  receiverId: string;
  senderName?: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  status: "online" | "offline" | "away";
  timestamp: string;
  activeCount?: number;
}

// Gentle Web Audio API chime generator for incoming messages
export function playMessageChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Primary chime oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
    
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.35);
  } catch (err) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
}

export class RealtimeMessageClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private status: RealtimeStatus = "disconnected";
  private userId: string = "";
  private userName: string = "";
  private role: string = "";

  private onMessageCallbacks: Array<(msg: Message) => void> = [];
  private onTypingCallbacks: Array<(typing: TypingEvent) => void> = [];
  private onPresenceCallbacks: Array<(presence: PresenceEvent) => void> = [];
  private onStatusCallbacks: Array<(status: RealtimeStatus) => void> = [];
  private genericEventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {}

  public connect(userId: string, userName: string, role: string) {
    this.userId = userId;
    this.userName = userName;
    this.role = role;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Send updated auth
      this.sendRaw({
        type: "auth",
        userId,
        userName,
        role
      });
      return;
    }

    this.setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus("connected");
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Authenticate connection
        this.sendRaw({
          type: "join",
          userId: this.userId,
          userName: this.userName,
          role: this.role
        });

        // Setup ping interval
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendRaw({ type: "ping" });
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "message:new" && data.message) {
            this.onMessageCallbacks.forEach(cb => cb(data.message));
          } else if (data.type === "typing") {
            this.onTypingCallbacks.forEach(cb => cb({
              senderId: data.senderId,
              receiverId: data.receiverId,
              senderName: data.senderName,
              isTyping: data.isTyping
            }));
          } else if (data.type === "presence:update") {
            this.onPresenceCallbacks.forEach(cb => cb({
              userId: data.userId,
              status: data.status,
              timestamp: data.timestamp,
              activeCount: data.activeCount
            }));
          }

          // Dispatch to generic listeners
          if (data.type && this.genericEventListeners.has(data.type)) {
            const list = this.genericEventListeners.get(data.type) || [];
            list.forEach(cb => {
              try { cb(data); } catch (e) { console.error("Error in WS event listener:", e); }
            });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.ws.onclose = () => {
        this.setStatus("disconnected");
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
        this.setStatus("error");
      };
    } catch (err) {
      console.error("WebSocket connection setup error:", err);
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId) {
        this.connect(this.userId, this.userName, this.role);
      }
    }, 3000);
  }

  private setStatus(status: RealtimeStatus) {
    this.status = status;
    this.onStatusCallbacks.forEach(cb => cb(status));
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  public sendRaw(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  public sendMessage(
    senderId: string, 
    receiverId: string, 
    content: string, 
    existingId?: string,
    isAnnouncement?: boolean,
    courseId?: string
  ) {
    const messageId = existingId || `msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const payload = {
      type: "message:send",
      id: messageId,
      senderId,
      receiverId,
      content,
      isAnnouncement: Boolean(isAnnouncement),
      courseId
    };

    const success = this.sendRaw(payload);

    // Only fallback to HTTP POST if WebSocket connection is not open
    if (!success) {
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: messageId,
          senderId,
          receiverId,
          content,
          isAnnouncement: Boolean(isAnnouncement),
          courseId
        })
      }).catch(err => console.warn("HTTP message fallback send error:", err));
    }

    return success;
  }

  public sendTyping(senderId: string, receiverId: string, senderName: string, isTyping: boolean) {
    this.sendRaw({
      type: "typing",
      senderId,
      receiverId,
      senderName,
      isTyping
    });
  }

  public markRead(senderId: string, receiverId: string) {
    this.sendRaw({
      type: "message:read",
      senderId,
      receiverId
    });
    fetch("/api/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, receiverId })
    }).catch(() => {});
  }

  public on(eventType: string, cb: (data: any) => void) {
    if (!this.genericEventListeners.has(eventType)) {
      this.genericEventListeners.set(eventType, []);
    }
    this.genericEventListeners.get(eventType)!.push(cb);
    return () => {
      const list = this.genericEventListeners.get(eventType) || [];
      this.genericEventListeners.set(eventType, list.filter(item => item !== cb));
    };
  }

  public onMessage(cb: (msg: Message) => void) {
    this.onMessageCallbacks.push(cb);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(c => c !== cb);
    };
  }

  public onTyping(cb: (typing: TypingEvent) => void) {
    this.onTypingCallbacks.push(cb);
    return () => {
      this.onTypingCallbacks = this.onTypingCallbacks.filter(c => c !== cb);
    };
  }

  public onPresence(cb: (presence: PresenceEvent) => void) {
    this.onPresenceCallbacks.push(cb);
    return () => {
      this.onPresenceCallbacks = this.onPresenceCallbacks.filter(c => c !== cb);
    };
  }

  public onStatusChange(cb: (status: RealtimeStatus) => void) {
    this.onStatusCallbacks.push(cb);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter(c => c !== cb);
    };
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }
}

export const realtimeClient = new RealtimeMessageClient();
