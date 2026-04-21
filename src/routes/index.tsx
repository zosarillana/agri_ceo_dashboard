import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/"!</div>
}
// import { createFileRoute, redirect } from "@tanstack/react-router";

// export const Route = createFileRoute("/")({
//   //   component: RouteComponent,|
//   beforeLoad: () => {
//     throw redirect({ to: "/about" });
//   },
// });

// function RouteComponent() {
//   return <div>Hello "/"!</div>;
// }
