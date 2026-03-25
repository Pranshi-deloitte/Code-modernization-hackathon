// Replaces StatusController + status.html
// Green success / red danger alert bar with close button
export default function StatusMessage({ status, onClear }) {
  if (!status) return null;

  const cls = status.isError ? 'alert-danger' : 'alert-success';
  return (
    <div className={`alert ${cls} alert-dismissible`} role="alert">
      {status.message}
      <button type="button" className="btn-close" onClick={onClear} aria-label="Close" />
    </div>
  );
}
