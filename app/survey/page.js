import SurveyForm from "@/components/SurveyForm";

export const metadata = {
  title: "アンケート | Top Firm Pass",
  description: "Top Firm Pass モニタープランへのご意見をお聞かせください。",
};

export default function SurveyPage() {
  return (
    <div>
      <h1 className="section-title">アンケート</h1>
      <SurveyForm />
    </div>
  );
}
