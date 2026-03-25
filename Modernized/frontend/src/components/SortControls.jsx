// Replaces sort links in albums.html
// ng-click="sortField='title'" etc. + chevron up/down toggle
export default function SortControls({ sortField, sortDescending, onSort, onToggleDirection }) {
  const fields = [
    { key: 'title', label: 'title' },
    { key: 'artist', label: 'artist' },
    { key: 'releaseYear', label: 'year' },
    { key: 'genre', label: 'genre' }
  ];

  return (
    <span>
      {' | sort by: '}
      {fields.map(({ key, label }) => (
        <span key={key}>
          <button
            className={`btn btn-link btn-sm p-0 ${sortField === key ? 'fw-bold text-decoration-underline' : ''}`}
            onClick={() => onSort(key)}
          >
            {label}
          </button>
          {' '}
        </span>
      ))}
      <button className="btn btn-link btn-sm p-0" onClick={onToggleDirection} title="Toggle sort direction">
        {sortDescending ? '▼' : '▲'}
      </button>
    </span>
  );
}
