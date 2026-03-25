import { useEffect, useState } from 'react';
import { useStatus } from '../hooks/useStatus';
import { useAlbums } from '../hooks/useAlbums';
import StatusMessage from './StatusMessage';
import ViewToggle from './ViewToggle';
import SortControls from './SortControls';
import AlbumGrid from './AlbumGrid';
import AlbumList from './AlbumList';
import AlbumForm from './AlbumForm';

// Replaces AlbumsController + albums.html
// State: albums, view (grid/list), sortField, sortDescending, modal
export default function AlbumsPage() {
  const statusHook = useStatus();
  const { albums, fetchAlbums, addAlbum, updateAlbum, deleteAlbum } = useAlbums(statusHook);

  const [view, setView] = useState('grid');
  const [sortField, setSortField] = useState('title');
  const [sortDescending, setSortDescending] = useState(false);
  const [modal, setModal] = useState(null); // null | { action: 'add'|'update', album }

  // Replaces $scope.init() → list()
  useEffect(() => { fetchAlbums(); }, []);

  // Replaces ng-repeat orderBy:sortField:sortDescending
  const sorted = [...albums].sort((a, b) => {
    const av = (a[sortField] || '').toString().toLowerCase();
    const bv = (b[sortField] || '').toString().toLowerCase();
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDescending ? -cmp : cmp;
  });

  function openAdd() {
    setModal({ action: 'add', album: {} });
  }

  function openEdit(album) {
    setModal({ action: 'update', album });
  }

  async function handleFormSubmit(album) {
    if (modal.action === 'add') {
      await addAlbum(album);
    } else {
      await updateAlbum(album);
    }
    setModal(null);
  }

  async function handleInlineUpdate(album) {
    await updateAlbum(album);
  }

  return (
    <div id="albums">
      <div className="page-header mb-3">
        <h1>Albums</h1>
        <div>
          <ViewToggle view={view} onChange={setView} />
          <SortControls
            sortField={sortField}
            sortDescending={sortDescending}
            onSort={setSortField}
            onToggleDirection={() => setSortDescending(d => !d)}
          />
          <span> | </span>
          <button className="btn btn-link btn-sm p-0" onClick={openAdd}>
            ＋ add an album
          </button>
        </div>
      </div>

      <div className="row">
        <StatusMessage status={statusHook.status} onClear={statusHook.clear} />
      </div>

      {view === 'grid' ? (
        <AlbumGrid
          albums={sorted}
          onUpdate={handleInlineUpdate}
          onEdit={openEdit}
          onDelete={deleteAlbum}
        />
      ) : (
        <AlbumList
          albums={sorted}
          onUpdate={handleInlineUpdate}
          onEdit={openEdit}
          onDelete={deleteAlbum}
        />
      )}

      {modal && (
        <AlbumForm
          album={modal.album}
          action={modal.action}
          onSubmit={handleFormSubmit}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
