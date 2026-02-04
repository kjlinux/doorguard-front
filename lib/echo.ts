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
  Pusher.logToConsole = true

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http"
  const forceTLS = scheme === "https"

  const config = {
    broadcaster: "reverb" as const,
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "doorguard-key",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS,
    enabledTransports: (forceTLS ? ["wss"] : ["ws", "wss"]) as ("ws" | "wss")[],
    cluster: "",
    disableStats: true,
  }

  console.log("[Echo] Creating instance with config:", config)

  echoInstance = new Echo(config)

  // Force the connection
  const pusher = (echoInstance as any).connector?.pusher
  if (pusher) {
    console.log("[Echo] Pusher instance found, state:", pusher.connection?.state)
    pusher.connection.bind("state_change", (states: any) => {
      console.log("[Echo] Pusher state change:", states.previous, "->", states.current)
    })
    pusher.connection.bind("error", (err: any) => {
      console.error("[Echo] Pusher connection error:", err)
    })
    pusher.connect()
  } else {
    console.error("[Echo] No Pusher instance found!")
  }

  return echoInstance
}
