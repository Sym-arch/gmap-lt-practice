import { notFound } from "next/navigation";
import { getExamMeta } from "@/lib/examMeta";
import ExamHome from "@/components/ExamHome";

export default async function ExamPage({ params }) {
  const { examId } = await params;
  const meta = getExamMeta(examId);
  if (!meta) notFound();
  return <ExamHome meta={meta} />;
}

export function generateStaticParams() {
  return [
    { examId: "gmap" },
    { examId: "tgweb" },
    { examId: "tamatebako" },
    { examId: "spi3" },
  ];
}
