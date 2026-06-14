import SignupForm from "@/components/SignupForm";
import { SITE_NAME } from "@/lib/site";

export const metadata = { title: "会員登録" };

export default function SignupPage() {
  return (
    <div>
      <h1>会員登録</h1>
      <div className="subtitle">
        {SITE_NAME}にご登録いただきます。
        個人情報をご入力のあと、続けて決済をお願いします。
      </div>
      <SignupForm />
    </div>
  );
}
