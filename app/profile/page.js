import ProfilePanel from "@/components/ProfilePanel";

export const metadata = { title: "マイページ" };

export default function ProfilePage() {
  return (
    <div>
      <h1>マイページ</h1>
      <div className="subtitle">学習の記録と成長を確認できます。</div>
      <ProfilePanel />
    </div>
  );
}
