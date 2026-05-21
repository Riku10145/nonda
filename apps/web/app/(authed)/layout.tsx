import { Shell } from "./_shell";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
