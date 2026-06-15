import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card auth-card"><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}
