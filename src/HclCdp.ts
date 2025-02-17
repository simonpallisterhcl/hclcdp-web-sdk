import { CdpClient } from "./CdpClient"
import { SessionManager } from "./SessionManager"
import EventQueue from "./EventQueue"
import { HclCdpConfig, SessionData } from "./types"

declare global {
  interface Window {
    HclCdp: typeof HclCdp
  }
}

export class HclCdp {
  private static instance: HclCdp
  private cdpClient: CdpClient | null = null
  public static deviceId: string | null = null
  public sessionId: string | null = null
  private sessionManager: SessionManager | null = null
  private static config: HclCdpConfig = {
    writeKey: "",
    cdpEndpoint: "",
    inactivityTimeout: 30,
    enableSessionLogging: false,
    enableUserLogoutLogging: false,
  }

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static async init(config: HclCdpConfig, callback?: (error: Error | null, sessionData?: SessionData) => void) {
    if (!HclCdp.instance) {
      HclCdp.instance = new HclCdp()
    }

    this.config = config

    // Initialize CDP client
    HclCdp.instance.cdpClient = new CdpClient()

    // Pass the static methods as callbacks
    HclCdp.instance.sessionManager = new SessionManager(config, HclCdp.onSessionStart, HclCdp.onSessionEnd)

    try {
      await HclCdp.instance.cdpClient.init(config)

      // Flush queued events
      EventQueue.flushQueue(EventQueue.PAGE_QUEUE_KEY, HclCdp.instance.cdpClient.page.bind(HclCdp.instance.cdpClient))
      EventQueue.flushQueue(EventQueue.TRACK_QUEUE_KEY, HclCdp.instance.cdpClient.track.bind(HclCdp.instance.cdpClient))
      EventQueue.flushQueue(
        EventQueue.IDENTIFY_QUEUE_KEY,
        HclCdp.instance.cdpClient.identify.bind(HclCdp.instance.cdpClient),
      )

      // Attach the instance to the window object
      if (typeof window !== "undefined") {
        if (!window.HclCdp) {
          window.HclCdp = HclCdp
        } else {
          console.warn("window.HclCdp is already defined. Skipping attachment.")
        }
      }

      // Call the callback with the deviceId
      if (callback) callback(null, { deviceId: HclCdp.getDeviceId() || null, sessionId: HclCdp.getSessionId() || null })
    } catch (error) {
      // Call the callback with the error
      console.log("Error initializing HCL CDP SDK:", error)
      if (callback) callback(error as Error)
    }
  }

  static onSessionStart = (sessionId: string) => {
    if (this.config.enableSessionLogging) {
      HclCdp.instance.cdpClient?.track("Session_Start", sessionId)
    }
  }

  static onSessionEnd = (sessionId: string) => {
    if (this.config.enableSessionLogging) {
      HclCdp.instance.cdpClient?.track("Session_End", sessionId)
    }
  }

  static page = async (pageName: string, properties?: Record<string, any>, otherIds?: Record<string, any>) => {
    const payload = {
      sessionId: this.getSessionId(),
      pageName,
      properties: {
        ...properties,
        path: window.location.pathname,
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      },
      otherIds,
    }

    if (!HclCdp.instance || !HclCdp.instance.cdpClient) {
      // If the SDK is not initialized, queue the event
      console.log("adding to queue")
      EventQueue.addToQueue(EventQueue.PAGE_QUEUE_KEY, payload)
      return
    }

    const pageProperties = {
      ...properties,
      path: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
    }

    // If the SDK is initialized, send the event
    HclCdp.instance.cdpClient.page(pageName, this.getSessionId(), pageProperties, otherIds)
  }

  static track = async (eventName: string, properties?: Record<string, any>, otherIds?: Record<string, any>) => {
    const payload = {
      sessionId: this.getSessionId(),
      eventName,
      properties,
      otherIds,
    }

    if (!HclCdp.instance || !HclCdp.instance.cdpClient) {
      // If the SDK is not initialized, queue the event
      EventQueue.addToQueue(EventQueue.TRACK_QUEUE_KEY, payload)
      return
    }

    // If the SDK is initialized, send the event
    HclCdp.instance.cdpClient.track(eventName, this.getSessionId(), properties, otherIds)
  }

  static identify = async (userId: string, properties?: Record<string, any>, otherIds?: Record<string, any>) => {
    const payload = {
      sessionId: this.getSessionId(),
      userId,
      properties,
      otherIds,
    }

    if (!HclCdp.instance || !HclCdp.instance.cdpClient) {
      // If the SDK is not initialized, queue the event
      EventQueue.addToQueue(EventQueue.IDENTIFY_QUEUE_KEY, payload)
      return
    }

    // If the SDK is initialized, send the event
    HclCdp.instance.cdpClient.identify(userId, this.getSessionId(), properties, otherIds)
  }

  static getDeviceId(): string | "" {
    return HclCdp.instance?.cdpClient?.deviceId || ""
  }

  static getSessionId(): string | "" {
    return HclCdp.instance?.sessionManager?.getSessionId() || ""
  }

  static logout = async () => {
    if (this.config.enableUserLogoutLogging) {
      HclCdp.instance.cdpClient?.logout(this.getSessionId())
    }
  }
}
