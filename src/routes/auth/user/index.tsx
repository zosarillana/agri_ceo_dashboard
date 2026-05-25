import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/user/")({
  beforeLoad: () => {
    throw redirect({
      to: "/auth/user/dashboard",
    });
  },
});
