import { notFound } from "next/navigation";
import { getExamMeta } from "@/lib/examMeta";
import Quiz from "@/components/Quiz";

export default async function ReviewPage({ params }) {
  const { examId } = await params;
  const meta = getExamMeta(examId);
  if (!meta) notFound();

  return (
    <Quiz
      examId={meta.id}
      examName={meta.name}
      categories={meta.categories}
      mode="review"
    />
  );
}
