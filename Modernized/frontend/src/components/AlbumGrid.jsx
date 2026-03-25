import AlbumCard from './AlbumCard';

// Replaces grid.html — 4-column responsive card grid
// ng-repeat="album in albums | orderBy:sortField:sortDescending"
export default function AlbumGrid({ albums, onUpdate, onEdit, onDelete }) {
  return (
    <div className="row multi-columns-row">
      {albums.map(album => (
        <AlbumCard
          key={album.id}
          album={album}
          onUpdate={onUpdate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
