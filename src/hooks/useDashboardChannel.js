import { useEffect } from "react";
import echo from "../../../lib/echo";

export function useDashboardChannel() {
    useEffect(() => {
        const channel = echo.channel("dashboard");

        channel.listen("OrderUpdated", (e) => {
            console.log("Order updated:", e);
        });

        return () => {
            echo.leaveChannel("dashboard");
        };
    }, []);
}