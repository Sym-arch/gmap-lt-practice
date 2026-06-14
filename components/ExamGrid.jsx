"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXAMS } from "@/lib/examMeta";

export default function ExamGrid() {
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <div className="exam-grid">
      {EXAMS.map((exam) => (
        <Link
          key={exam.id}
          href={`/exams/${exam.id}`}
          className="exam-card"
          style={{ "--accent": exam.accent }}
        >
          <span className="exam-tagline">{exam.tagline}</span>
          <span className="exam-name">{exam.name}</span>
          <span className="exam-desc">{exam.desc}</span>
          <span className="exam-foot">
            <span>模擬試験 全{exam.testCount}回</span>
            {!loggedIn && <span className="exam-free">無料体験あり</span>}
          </span>
        </Link>
      ))}
    </div>
  );
}
