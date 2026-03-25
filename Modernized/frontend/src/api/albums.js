// API client — replaces all AngularJS $resource factories (Albums, Album, Errors, Info)

const BASE = '';

async function request(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.errors ? err.errors.map(e => e.msg).join(', ') : err.error || res.statusText);
  }
  return res.json();
}

// Replaces Albums.query()
export const getAlbums = () => request('GET', '/albums');

// Replaces Album.get({id})
export const getAlbum = (id) => request('GET', `/albums/${id}`);

// Replaces Albums.save(album) — PUT for add (legacy convention)
export const addAlbum = (album) => request('PUT', '/albums', album);

// Replaces Albums.save({}, album) — POST for update (legacy convention)
export const updateAlbum = (album) => request('POST', '/albums', album);

// Replaces Album.delete({id})
export const deleteAlbum = (id) => request('DELETE', `/albums/${id}`);

// Replaces Info.get()
export const getAppInfo = () => request('GET', '/appinfo');

// Replaces Errors.kill()
export const killApp = () => request('GET', '/errors/kill');

// Replaces Errors.throw()
export const throwError = () => request('GET', '/errors/throw').catch(e => { throw e; });
