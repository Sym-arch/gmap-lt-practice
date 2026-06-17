/* 試験タイプのメタ情報（クライアントに送ってよい情報のみ。問題本文は含めない） */

export const EXAMS = [
  {
    id: "gmap",
    name: "GMAP（LT）",
    short: "GMAP",
    accent: "#197b55",
    tagline: "クリティカルシンキング",
    desc: "グロービス系テスト。論理構造・推論・数的処理など6分野で思考力を測る。",
    testCount: 10,
    availableTests: 10,
    firms: ["ボストン コンサルティング グループ（BCG）", "KPMGコンサルティング"],
    categories: {
      structure: "論理構造の把握",
      reasoning: "推論・論証の評価",
      quantitative: "数的推論",
      data: "図表・データ解釈",
      puzzle: "条件整理・推論",
      problem: "問題解決・意思決定",
    },
  },
  {
    id: "tgweb",
    name: "TG-WEB",
    short: "TG-WEB",
    accent: "#136d62",
    tagline: "従来型 計数・言語",
    desc: "暗号・図形数列など初見殺しの従来型を中心に、外資コンサルで頻出の形式を収録。",
    testCount: 10,
    availableTests: 10,
    firms: ["ローランド・ベルガー", "デロイト トーマツ コンサルティング", "PwCコンサルティング"],
    categories: {
      keisu: "計数",
      gengo: "言語",
      eigo: "英語",
    },
  },
  {
    id: "tamatebako",
    name: "玉手箱",
    short: "玉手箱",
    accent: "#3c8d4f",
    tagline: "計数・言語・英語",
    desc: "四則逆算・図表読み取り・GAB形式言語。スピードと正確性が問われる定番テスト。",
    testCount: 10,
    availableTests: 10,
    firms: [
      "ベイン・アンド・カンパニー",
      "EY（アーンスト・アンド・ヤング）",
      "KPMGコンサルティング",
      "アクセンチュア",
      "ベイカレント・コンサルティング",
      "日本IBM",
    ],
    categories: {
      keisu: "計数",
      gengo: "言語",
      eigo: "英語",
    },
  },
  {
    id: "spi3",
    name: "SPI3",
    short: "SPI3",
    accent: "#0d5a3c",
    tagline: "非言語・言語・構造的把握力",
    desc: "推論を中心とした非言語と、コンサル選考で課されることの多い構造的把握力検査に対応。",
    testCount: 10,
    availableTests: 10,
    firms: ["EY（アーンスト・アンド・ヤング）", "アビームコンサルティング"],
    categories: {
      higengo: "非言語",
      gengo: "言語",
      kozo: "構造的把握力",
      eigo: "英語",
    },
  },
];

export function getExamMeta(examId) {
  return EXAMS.find((e) => e.id === examId) || null;
}
