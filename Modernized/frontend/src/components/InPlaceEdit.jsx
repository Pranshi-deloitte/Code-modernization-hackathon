import { useState } from 'react';

// Replaces inPlaceEdit directive + AlbumEditorController (albums.js)
// Props: value, fieldName, pattern, onSave
// Click text → enter edit mode; Enter saves; Esc cancels
export default function InPlaceEdit({ value, fieldName, pattern, onSave }) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);
  const [error, setError] = useState('');

  function enable() {
    setCurrent(value);
    setError('');
    setEditing(true);
  }

  function disable() {
    setEditing(false);
    setError('');
  }

  function save() {
    if (!current || current.trim() === '') return;
    if (pattern && !new RegExp(pattern).test(current)) {
      setError(`Invalid format`);
      return;
    }
    onSave(current);
    setEditing(false);
    setError('');
  }

  function handleKey(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') disable();
  }

  if (!editing) {
    return (
      <span className="ipe-display" onClick={enable} title="Click to edit">
        {value || <em className="text-muted">(empty)</em>}
      </span>
    );
  }

  return (
    <div>
      <div className="ipe-input-group">
        <input
          autoFocus
          type="text"
          className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
          value={current}
          onChange={e => setCurrent(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="btn btn-sm btn-outline-success" onClick={save} title="Save">✓</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={disable} title="Cancel">✕</button>
      </div>
      {error && <div className="text-danger small">{error}</div>}
    </div>
  );
}
