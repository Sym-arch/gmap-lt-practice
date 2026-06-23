"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE_NAME, PRICE_LABEL } from "@/lib/site";
import styles from "./LpExperience.module.css";

/* 試験メタ＋詳しい説明＋実際の第1問（lib/exams の test01 先頭問題） */
const TESTS = [
  {
    id: "gmap",
    name: "GMAP(LT)",
    href: "/exams/gmap",
    tag: "クリティカルシンキング",
    firms: ["BCG", "KPMG"],
    cats: ["論理構造", "推論評価", "数的推論", "図表データ", "条件整理", "問題解決"],
    desc:
      "グロービス系の思考力テスト。文章の論理構造を見抜く力や、ビジネス場面での意思決定力を6分野で測ります。一問ごとに「考え方」が問われ、対策なしでは時間内に解き切るのが難しいのが特徴です。",
    sample: {
      cat: "論理構造の把握",
      q:
        "次の文章を読み、下線部の役割として最も適切なものを選べ。\n\n「確かにサブスク移行は短期的には既存売上を侵食する。しかし顧客との継続接点が生まれ、解約予兆検知や単価向上の施策を打てる。実際、先行移行した同業A社は3年でLTVを2倍に高めた。したがって当社も移行すべきだ。」",
      choices: [
        "結論を直接支える独立した根拠である",
        "「施策を打てる」という根拠を裏付ける実例である",
        "「売上を侵食する」への反論である",
        "結論を言い換えたものである",
      ],
      answer: 1,
    },
  },
  {
    id: "tgweb",
    name: "TG-WEB",
    href: "/exams/tgweb",
    tag: "従来型・計数言語",
    firms: ["Roland Berger", "Deloitte", "PwC"],
    cats: ["計数", "言語", "英語"],
    desc:
      "暗号・図形・数列など、初見では戸惑う難解な従来型。知っていれば解け、知らなければ手が出ない問題が多く、対策の有無で最も差がつく試験です。落ち着いて規則を見抜く訓練が効きます。",
    sample: {
      cat: "計数",
      q:
        "ある規則でアルファベットを数列に変換すると次のようになる。\n\nBANK → 3, 3, 17, 15\nDEAL → 5, 7, 4, 16\n\n同じ規則で「8, 17, 4, 16」となる単語はどれか。",
      choices: ["GOAL", "GOLD", "FOAM", "HOPE"],
      answer: 0,
    },
  },
  {
    id: "tamatebako",
    name: "玉手箱",
    href: "/exams/tamatebako",
    tag: "計数・言語・英語",
    firms: ["KPMG", "Bain", "EY", "Accenture", "BayCurrent", "IBM"],
    cats: ["四則逆算", "図表読み取り", "GAB言語", "英語"],
    desc:
      "総合系ファームで最も広く使われる定番。四則逆算や図表の読み取りを、1問あたり数十秒という短時間で大量に処理します。スピードと正確性の両立が合否を分けます。",
    sample: {
      cat: "計数（四則逆算）",
      q: "次の□に当てはまる数値はどれか。\n\n（□ − 3/4）× 0.6 ＝ 7/2 − 1.7",
      choices: ["15/4", "13/4", "7/2", "17/4"],
      answer: 0,
    },
  },
  {
    id: "spi3",
    name: "SPI3",
    href: "/exams/spi3",
    tag: "非言語・構造的把握",
    firms: ["EY", "Abeam"],
    cats: ["非言語（推論）", "言語", "構造的把握力", "英語"],
    desc:
      "最も普及した適性検査。推論中心の非言語と言語に加え、コンサル選考で重視される「構造的把握力検査」に対応。文の内容ではなく“推論の型”を見抜く力が問われます。",
    sample: {
      cat: "構造的把握力",
      q:
        "ア〜オを推論の構造で2つと3つに分けるとき、「2つ」グループの組み合わせはどれか。\n\nア レビューは星4以上が大半だ。だから良い店だ。\nイ 雨の日は電車が遅れやすい。今日は雨だ。だから早めに出よう。\nウ 過去3回は計算問題中心だった。次回も計算問題だろう。\nエ 会員は全員割引が受けられる。私は会員だ。だから割引される。\nオ A・B・C支店とも売上が伸びている。わが社は好調だ。",
      choices: ["イとエ", "アとウ", "アとオ", "ウとオ"],
      answer: 0,
    },
  },
];

const FREE_HREF = "/exams/gmap";
const MARKS = ["ア", "イ", "ウ", "エ", "オ"];

/* 残り枠に応じた煽り文言 */
function urgencyText(remaining) {
  if (remaining <= 10) return `残りわずか${remaining}名！`;
  if (remaining <= 30) return "残りわずか・お早めに";
  return "枠が埋まり次第終了";
}

/* 利用者の声 */
const VOICES = [
  {
    school: "早稲田大学 4年",
    firm: "BCG内定",
    text: "GMAP(LT)は市販の教材がほとんどなく、何から手をつければいいか分からず不安でした。Top Firm Passは出題形式そっくりの問題と解説が揃っていて、繰り返すうちに解き方の「型」が自然と身につきました。本番では時間にも余裕を持って臨め、自信を持って選考を突破できました。",
  },
  {
    school: "慶應義塾大学 4年",
    firm: "Big4内定",
    text: "模試を受けるたびに分野別の正答率が出るので、自分の弱点がひと目で分かりました。特に苦手だったTG-WEBの図形問題も、解説で考え方を理解してから復習機能で繰り返し、しっかり克服。やみくもに対策するより圧倒的に効率的で、短期間で得点が伸びました。",
  },
  {
    school: "東京大学 4年",
    firm: "Big4内定",
    text: "部活と両立しながらの就活で時間が取れない中、スマホでスキマ時間にサクサク解けるのが本当に助かりました。1問ずつ丁寧な解説があるので、移動中でも理解しながら進められます。気づけば全試験を一通り対策でき、複数ファームの選考に安心して臨めました。",
  },
];

export default function LpExperience() {
  const rootRef = useRef(null);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    fetch("/api/campaign")
      .then((r) => r.json())
      .then(setCampaign)
      .catch(() => setCampaign({ active: false }));
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.revealed);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      {/* ===== キャンペーン告知バー ===== */}
      {campaign?.active && (
        <a href="/signup" className={styles.campaignBar}>
          <span className={styles.campaignTag}>先着{campaign.limit}名限定</span>
          初月無料キャンペーン実施中
          <span className={styles.campaignRemain}>{urgencyText(campaign.remaining)}</span>
        </a>
      )}

      {/* ===== ファーストビュー ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-reveal>
            <span className={styles.eyebrow}>戦略・総合コンサル志望者へ</span>
            <h1 className={styles.h1}>
              Webテスト対策を、
              <br />
              <em>これ一つで。</em>
            </h1>
            <p className={styles.lead}>
              志望ファームを選ぶだけで、対策すべき試験がわかる。
            </p>
            <div className={styles.heroCta}>
              <Link href={FREE_HREF} className={styles.btnGold}>
                無料で試してみる
                <Arrow />
              </Link>
              <a href="#tests" className={styles.btnGhost}>
                志望ファームから探す
              </a>
            </div>
            <div className={styles.heroMeta}>
              <span><b>4</b>試験対応</span>
              <span className={styles.dot} />
              <span><b>1,200</b>問</span>
              <span className={styles.dot} />
              <span>月額<b>{PRICE_LABEL.replace("¥", "")}</b>円</span>
            </div>
          </div>

          <div className={styles.heroVisual} data-reveal>
            <PhoneShot
              src="/lp/app-home.png"
              alt="Top Firm Pass アプリのホーム画面"
              fallback={<AppHomeFallback />}
            />
          </div>
        </div>
      </section>

      {/* ===== 統合：対応テスト × 志望ファーム × 実際の第1問 ===== */}
      <section className={styles.tests} id="tests">
        <header className={styles.sectionHead} data-reveal>
          <span className={styles.kicker}>FIND YOUR TEST</span>
          <h2 className={styles.h2Dark}>志望ファームの試験を選んで、対策する</h2>
          <p className={styles.sectionSub}>
            各試験の「実際の第1問」を、そのまま体験できます。
          </p>
        </header>

        <div className={styles.testList}>
          {TESTS.map((t, i) => (
            <article
              key={t.id}
              className={`${styles.testBlock} ${i % 2 === 1 ? styles.blockAlt : ""}`}
              data-reveal
            >
              <div className={styles.testGrid}>
                <div className={styles.testInfo}>
                  <div className={styles.testTop}>
                    <span className={styles.testIcon}>
                      <TestIcon id={t.id} />
                    </span>
                    <div>
                      <span className={styles.testNo}>0{i + 1}</span>
                      <h3 className={styles.testName}>{t.name}</h3>
                      <span className={styles.testTag}>{t.tag}</span>
                    </div>
                  </div>

                  <p className={styles.testDesc}>{t.desc}</p>

                  <div className={styles.catRow}>
                    {t.cats.map((c) => (
                      <span className={styles.cat} key={c}>{c}</span>
                    ))}
                  </div>

                  <div className={styles.firmBlock}>
                    <span className={styles.firmLabel}>この試験を課す主なファーム</span>
                    <div className={styles.firmChips}>
                      {t.firms.map((f) => (
                        <span className={styles.chip} key={f}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.testShot}>
                  <QuizShot test={t} />
                  <Link href={t.href} className={styles.btnTest}>
                    {t.name}を試してみる
                    <Arrow small />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== 特徴（3つ） ===== */}
      <section className={styles.features}>
        <header className={styles.sectionHead} data-reveal>
          <span className={styles.kickerGold}>WHY TOP FIRM PASS</span>
          <h2 className={styles.h2Light}>選ばれる、3つの理由</h2>
        </header>
        <div className={styles.featGrid}>
          {[
            {
              icon: <IconDoc />,
              t: "本番形式の模擬試験 10回分",
              d: "GMAP(LT)・TG-WEB・玉手箱・SPI3 を各全10回・計1,200問。出題傾向に沿った実戦形式で、繰り返し解いて実力を定着させます。",
            },
            {
              icon: <IconTarget />,
              t: "他では対策しにくい試験までカバー",
              d: "市販の対策本が少ないGMAP(LT)などにも対応。志望ファームで課される4試験すべてを、このアプリ1つで対策できます。",
            },
            {
              icon: <IconBook />,
              t: "全問にていねいな解説付き",
              d: "正解の理由から考え方まで解説。間違えた問題は自動で復習リストに入り、本番で使える力が着実に身につきます。",
            },
          ].map((f, i) => (
            <div className={styles.featCard} key={i} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <span className={styles.featIcon}>{f.icon}</span>
              <h3 className={styles.featT}>{f.t}</h3>
              <p className={styles.featD}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 利用者の声 ===== */}
      <section className={styles.voices}>
        <header className={styles.sectionHead} data-reveal>
          <span className={styles.kicker}>VOICES</span>
          <h2 className={styles.h2Dark}>利用者の声</h2>
        </header>
        <div className={styles.voiceGrid}>
          {VOICES.map((v, i) => (
            <figure
              className={styles.voiceCard}
              key={i}
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className={styles.voiceHead}>
                <span className={styles.voiceAvatar}>
                  <Avatar />
                </span>
                <figcaption>
                  <span className={styles.voiceSchool}>{v.school}</span>
                  <span className={styles.voiceFirm}>{v.firm}</span>
                </figcaption>
              </div>
              <blockquote className={styles.voiceText}>{v.text}</blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* ===== 料金 ===== */}
      <section className={styles.pricing}>
        <div className={styles.priceCard} data-reveal>
          <span className={styles.kickerGold}>PLAN</span>
          {campaign?.active && (
            <div className={styles.priceCampaign}>
              初月無料・先着{campaign.limit}名
            </div>
          )}
          <div className={styles.priceRow}>
            <span className={styles.priceCur}>¥</span>
            <span className={styles.priceNum}>1,480</span>
            <span className={styles.priceUnit}>／ 月（税込）</span>
          </div>
          <p className={styles.priceNote}>
            4試験すべて・全問解説・復習機能が使い放題。
          </p>
          <Link href="/signup" className={styles.btnGold}>
            会員登録する
            <Arrow />
          </Link>
        </div>
      </section>

      {/* ===== 最後のCTA ===== */}
      <section className={styles.finalCta}>
        <div className={styles.finalInner} data-reveal>
          <h2 className={styles.h2Light}>
            志望ファームのWebテスト対策を、
            <br />
            今すぐ始める。
          </h2>
          <Link href={FREE_HREF} className={styles.btnGoldLg}>
            無料で試してみる
            <Arrow />
          </Link>
          <div className={styles.finalBrand}>{SITE_NAME}</div>
        </div>
      </section>

      {/* ===== Meta広告設定用の管理情報 ===== */}
      <div style={{ textAlign: "center", padding: "14px 16px 10px", fontSize: 11.5, color: "#8a9a90", background: "#edf3ef" }}>
        Meta Pixel ID：<span style={{ fontFamily: "monospace", letterSpacing: "0.08em", color: "#15734e", fontWeight: 700 }}>1374111384591173</span>
        　／　CV イベント：<span style={{ fontFamily: "monospace", color: "#15734e", fontWeight: 700 }}>CompleteRegistration</span>（登録完了時に自動送信）
      </div>
    </div>
  );
}

/* ---------- 実問題の“アプリ画面風”カード ---------- */
function QuizShot({ test }) {
  const s = test.sample;
  return (
    <div className={styles.shotFrame}>
      <div className={styles.shotBar}>
        <span className={styles.shotDot} />
        {test.name}
        <span className={styles.shotProg}>第1問 / 30</span>
      </div>
      <div className={styles.shotScreen}>
        <div className={styles.progressTrack}>
          <span className={styles.progressFill} />
        </div>
        <span className={styles.qChip}>{s.cat}</span>
        <p className={styles.qText}>{s.q}</p>
        <div className={styles.choices}>
          {s.choices.map((c, i) => (
            <div
              key={i}
              className={`${styles.choice} ${i === s.answer ? styles.choiceOk : ""}`}
            >
              <span className={styles.choiceMark}>{MARKS[i]}</span>
              <span>{c}</span>
              {i === s.answer && (
                <span className={styles.choiceTick}><Check /></span>
              )}
            </div>
          ))}
        </div>
        <div className={styles.shotFoot}>
          <Check small /> 全問にていねいな解説つき
        </div>
      </div>
    </div>
  );
}

/* 画像が「実際に読み込めたとき」だけ true を返す（404時はフォールバック表示） */
function useImageReady(src) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new window.Image();
    img.onload = () => alive && setReady(true);
    img.onerror = () => alive && setReady(false);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return ready;
}

/* ---------- ヒーローのスマホ（実スクショ or フォールバック） ---------- */
function PhoneShot({ src, alt, fallback }) {
  const ready = useImageReady(src);
  return (
    <div className={styles.phone}>
      <span className={styles.phoneGlow} aria-hidden />
      <div className={styles.phoneBody}>
        <span className={styles.notch} />
        <div className={styles.phoneScreen}>
          {ready ? (
            <img src={src} alt={alt} className={styles.phoneImg} />
          ) : (
            fallback
          )}
        </div>
      </div>
    </div>
  );
}

/* スクショ未配置時の代替：アプリのホーム（学習プラン）を再現 */
const APP_PROGRESS = { gmap: 72, tgweb: 65, tamatebako: 58, spi3: 40 };
function AppHomeFallback() {
  return (
    <div className={styles.appHome}>
      <div className={styles.appBar}>
        <span className={styles.appDot} />
        学習プラン
      </div>

      <div className={styles.appToday}>
        <div className={styles.appTodayTop}>
          <span>今日の学習</span>
          <span className={styles.appTodayNum}>
            120<small> / 200問</small>
          </span>
        </div>
        <div className={styles.appBar2}>
          <span style={{ width: "60%" }} />
        </div>
        <div className={styles.appTodaySub}>達成率 60%</div>
      </div>

      <div className={styles.appSecLabel}>試験別対策</div>
      {TESTS.map((t, i) => (
        <div className={styles.appCard} key={t.id} style={{ "--n": i }}>
          <div className={styles.appCardL}>
            <span className={styles.appCardDot} />
            <div className={styles.appCardBody}>
              <div className={styles.appCardName}>{t.name}</div>
              <div className={styles.appMini}>
                <span style={{ width: `${APP_PROGRESS[t.id]}%` }} />
              </div>
            </div>
          </div>
          <span className={styles.appPct}>{APP_PROGRESS[t.id]}%</span>
        </div>
      ))}

      <div className={styles.appCta}>今日の模試を始める</div>
    </div>
  );
}

/* 利用者の声のアバター（汎用の人物アイコン） */
function Avatar() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#e3efe9" />
      <circle cx="24" cy="19" r="8" fill="#15734e" />
      <path d="M10 41c2.4-8 9-12 14-12s11.6 4 14 12z" fill="#15734e" />
    </svg>
  );
}

/* ---------- 試験ごとのアイコン ---------- */
function TestIcon({ id }) {
  const c = { width: 34, height: 34, viewBox: "0 0 48 48", fill: "none", "aria-hidden": true };
  if (id === "gmap")
    return (
      <svg {...c}>
        <circle cx="24" cy="13" r="5" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="12" cy="33" r="5" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="36" cy="33" r="5" stroke="currentColor" strokeWidth="2.4" />
        <path d="M21 17l-6 12M27 17l6 12M17 33h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  if (id === "tgweb")
    return (
      <svg {...c}>
        <rect x="8" y="8" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2.4" />
        <rect x="26" y="8" width="14" height="14" rx="7" stroke="currentColor" strokeWidth="2.4" />
        <path d="M9 33h13M9 39h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M28 36l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (id === "tamatebako")
    return (
      <svg {...c}>
        <rect x="8" y="9" width="32" height="30" rx="3" stroke="currentColor" strokeWidth="2.4" />
        <path d="M8 19h32M20 19v20" stroke="currentColor" strokeWidth="2.4" />
        <path d="M27 27l8 8M35 27l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg {...c}>
      <path d="M24 6l16 9-16 9-16-9z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M8 24l16 9 16-9M8 33l16 9 16-9" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- 汎用アイコン ---------- */
function Arrow({ small }) {
  const s = small ? 15 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Check({ small }) {
  const s = small ? 14 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 6v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 6C10.5 4.8 8.3 4.3 4 4.5v13c4.3-.2 6.5.3 8 1.5 1.5-1.2 3.7-1.7 8-1.5v-13c-4.3-.2-6.5.3-8 1.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
