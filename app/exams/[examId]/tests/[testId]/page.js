import { notFound } from "next/navigation";
import { getExamMeta } from "@/lib/examMeta";
import Quiz from "@/components/Quiz";

export default async function TestPage({ params }) {
  const { examId, testId } = await params;
  const meta = getExamMeta(examId);
  const n = parseInt(testId, 10);
  if (!meta || !Number.isInteger(n) || n < 1 || n > meta.testCount) notFound();

  return (
    <Quiz
      examId={meta.id}
      examName={meta.name}
      categories={meta.categories}
      mode="test"
      testId={n}
    />
  );
}
