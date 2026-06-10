import { useEffect, useRef } from "react";
import { echo } from "@/lib/echo";

type Callback<T = unknown> = (data: T) => void;

export default function useRealtimeListener<T = unknown>(
  channel: string,
  event: string,
  callback: Callback<T>,
): void {
  const processedMessages = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!channel || !event) return;

    const listener = (data: T) => {
      const now = Date.now();

      // Remove old entries (5s TTL)
      for (const [key, timestamp] of processedMessages.current.entries()) {
        if (now - timestamp > 5000) {
          processedMessages.current.delete(key);
        }
      }

      const message = data as any;

      const messageKey =
        message?.id ??
        message?.uuid ??
        JSON.stringify(message);

      if (processedMessages.current.has(messageKey)) {
        console.log("[Realtime] Duplicate ignored:", messageKey);
        return;
      }

      processedMessages.current.set(messageKey, now);

      callback(data);
    };

    echo.channel(channel).listen(event, listener);

    return () => {
      echo.leave(channel);
    };
  }, [channel, event, callback]);
}