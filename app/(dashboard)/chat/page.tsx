import "./main.css";
import Sub from "./sab";
import { auth } from "@/auth";

/* ──────────────────────────────────────────
   ChatPage Component
   ────────────────────────────────────────── */
export default async function ChatPage() {
  const session = await auth();

  return (
    <>
      <Sub user={session?.user ?? null}/>
    </>
  );
}
