/* ブランドカラーのローディングスピナー（くるくる回る円） */
export default function Spinner({ label }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-label="読み込み中" role="status" />
      {label && <div className="spinner-label">{label}</div>}
    </div>
  );
}
