import InPlaceEdit from './InPlaceEdit';

// Replaces list.html — striped table with inline edit + dropdown cog menu
export default function AlbumList({ albums, onUpdate, onEdit, onDelete }) {
  function saveField(album, fieldName, newValue) {
    onUpdate({ ...album, [fieldName]: newValue });
  }

  return (
    <div className="col-xs-12">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Album Title</th>
            <th>Artist</th>
            <th>Year</th>
            <th>Genre</th>
            <th>Tracks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {albums.map(album => (
            <tr key={album.id}>
              <td>
                <InPlaceEdit value={album.title} fieldName="title"
                  onSave={v => saveField(album, 'title', v)} />
              </td>
              <td>
                <InPlaceEdit value={album.artist} fieldName="artist"
                  onSave={v => saveField(album, 'artist', v)} />
              </td>
              <td>
                <InPlaceEdit value={album.releaseYear} fieldName="releaseYear"
                  pattern="^[1-2]\\d{3}$"
                  onSave={v => saveField(album, 'releaseYear', v)} />
              </td>
              <td>
                <InPlaceEdit value={album.genre} fieldName="genre"
                  onSave={v => saveField(album, 'genre', v)} />
              </td>
              <td>{album.trackCount || 0}</td>
              <td className="dropdown">
                <a href="#" className="dropdown-toggle text-secondary" data-bs-toggle="dropdown">
                  ⚙
                </a>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={() => onEdit(album)}>edit</button></li>
                  <li><button className="dropdown-item text-danger" onClick={() => onDelete(album.id)}>delete</button></li>
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
