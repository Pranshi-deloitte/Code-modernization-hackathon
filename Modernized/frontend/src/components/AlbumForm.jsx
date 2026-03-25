import { useState, useEffect } from 'react';

// Replaces AlbumModalController + albumForm.html
// Modal dialog for add/edit with validation (yearPattern = /^[1-2]\d{3}$/)
const YEAR_PATTERN = /^[1-2]\d{3}$/;
const EMPTY = { title: '', artist: '', releaseYear: '', genre: '' };

export default function AlbumForm({ album, action, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setForm(album ? { ...EMPTY, ...album } : EMPTY);
    setTouched({});
  }, [album]);

  function field(name) {
    return {
      value: form[name] || '',
      onChange: e => setForm(f => ({ ...f, [name]: e.target.value })),
      onBlur: () => setTouched(t => ({ ...t, [name]: true }))
    };
  }

  const errors = {
    title: !form.title ? 'Title is required' : '',
    artist: !form.artist ? 'Artist is required' : '',
    releaseYear: !form.releaseYear
      ? 'Release year is required'
      : !YEAR_PATTERN.test(form.releaseYear)
      ? 'Year must match [1-2]XXX (e.g. 1969, 2024)'
      : '',
    genre: !form.genre ? 'Genre is required' : ''
  };

  const isValid = Object.values(errors).every(e => !e);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ title: true, artist: true, releaseYear: true, genre: true });
    if (!isValid) return;
    onSubmit(form);
  }

  function fieldClass(name) {
    if (!touched[name]) return 'form-control';
    return `form-control ${errors[name] ? 'is-invalid' : 'is-valid'}`;
  }

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {action === 'add' ? 'Add an album' : 'Edit an album'}
            </h5>
            <button type="button" className="btn-close" onClick={onCancel} />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {['title', 'artist', 'genre'].map(name => (
                <div className="mb-3" key={name}>
                  <label className="form-label text-capitalize">{name}</label>
                  <input type="text" className={fieldClass(name)} {...field(name)} />
                  {touched[name] && errors[name] && (
                    <div className="invalid-feedback">{errors[name]}</div>
                  )}
                </div>
              ))}
              <div className="mb-3">
                <label className="form-label">Release Year</label>
                <input type="text" className={fieldClass('releaseYear')} {...field('releaseYear')} placeholder="e.g. 1969" />
                {touched.releaseYear && errors.releaseYear && (
                  <div className="invalid-feedback">{errors.releaseYear}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!isValid && Object.keys(touched).length > 0}>
                {action === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
