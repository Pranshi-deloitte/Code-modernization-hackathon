import InPlaceEdit from './InPlaceEdit';

// Replaces single card <div class="thumbnail"> in grid.html
// InPlaceEdit for title/artist/releaseYear/genre; dropdown cog menu for edit/delete
export default function AlbumCard({ album, onUpdate, onEdit, onDelete }) {
  function saveField(fieldName, newValue) {
    onUpdate({ ...album, [fieldName]: newValue });
  }

  return (
    <div className="col-xs-6 col-sm-3 col-md-3 col-lg-3 mb-3">
      <div className="thumbnail card h-100">
        <div className="card-body caption">
          <h4>
            <InPlaceEdit
              value={album.title}
              fieldName="title"
              onSave={v => saveField('title', v)}
            />
          </h4>
          <h4>
            <InPlaceEdit
              value={album.artist}
              fieldName="artist"
              onSave={v => saveField('artist', v)}
            />
          </h4>
          <h5>
            <InPlaceEdit
              value={album.releaseYear}
              fieldName="releaseYear"
              pattern="^[1-2]\\d{3}$"
              onSave={v => saveField('releaseYear', v)}
            />
          </h5>
          <h5>
            <InPlaceEdit
              value={album.genre}
              fieldName="genre"
              onSave={v => saveField('genre', v)}
            />
          </h5>
          {album.trackCount > 0 && (
            <small className="text-muted">{album.trackCount} tracks</small>
          )}

          <div className="dropdown mt-2">
            <a href="#" className="dropdown-toggle text-secondary" data-bs-toggle="dropdown">
              ⚙
            </a>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => onEdit(album)}>edit</button></li>
              <li><button className="dropdown-item text-danger" onClick={() => onDelete(album.id)}>delete</button></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
