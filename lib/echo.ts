import Echo from "laravel-echo"
import Pusher from "pusher-js"

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

let echoInstance: Echo<"reverb"> | null = null

export function getEcho(): Echo<"reverb"> {
  if (typeof window === "undefined") {
    throw new Error("Echo can only be used in the browser")
  }

  if (echoInstance) return echoInstance

  window.Pusher = Pusher

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http"
  const forceTLS = scheme === "https"

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "doorguard-key",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS,
    enabledTransports: forceTLS ? ["wss"] : ["ws", "wss"],
    enableLogging: true,
    cluster: "",
    disableStats: true,
  })

  console.log("[Echo] Configuration:", {
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
    forceTLS,
  })

  return echoInstance
}
