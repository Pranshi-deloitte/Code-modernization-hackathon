// Replaces view toggle links in albums.html
// ng-click="setAlbumsView('grid')" / ng-click="setAlbumsView('list')"
export default function ViewToggle({ view, onChange }) {
  return (
    <span>
      {' [ view as: '}
      <button
        className={`btn btn-link btn-sm p-0 ${view === 'grid' ? 'fw-bold' : ''}`}
        onClick={() => onChange('grid')}
        title="Grid view"
      >
        ⊞
      </button>
      {' '}
      <button
        className={`btn btn-link btn-sm p-0 ${view === 'list' ? 'fw-bold' : ''}`}
        onClick={() => onChange('list')}
        title="List view"
      >
        ☰
      </button>
      {' ]'}
    </span>
  );
}
