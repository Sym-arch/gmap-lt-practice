import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card auth-card">読み込み中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
