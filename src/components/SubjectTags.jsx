export const tagsOf = p => (p.tags?.length ? p.tags : p.subject ? [p.subject] : []);
export default function SubjectTags({ project, max }) {
  const all = tagsOf(project), list = max ? all.slice(0, max) : all, extra = all.length - list.length;
  if (!all.length) return <span className="text-muted">-</span>;
  return (
    <span className="d-inline-flex flex-wrap gap-1 align-middle">
      {list.map(t => <span key={t} className="badge rounded-pill bg-primary-subtle text-primary-emphasis fw-medium">{t}</span>)}
      {extra > 0 && <span className="badge rounded-pill bg-light text-muted border fw-medium">+{extra}</span>}
    </span>
  );
}