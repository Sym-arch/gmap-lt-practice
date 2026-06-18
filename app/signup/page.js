import SignupForm from "@/components/SignupForm";

export const metadata = { title: "会員登録" };

export default function SignupPage() {
  return (
    <div>
      <h1>会員登録</h1>
      <SignupForm />
    </div>
  );
}
