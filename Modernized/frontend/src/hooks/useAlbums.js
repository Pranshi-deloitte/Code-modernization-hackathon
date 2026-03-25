import { useState, useCallback } from 'react';
import * as api from '../api/albums';

// Replaces Albums/Album $resource factories + AlbumsController CRUD methods
export function useAlbums(statusHook) {
  const [albums, setAlbums] = useState([]);

  const fetchAlbums = useCallback(async () => {
    try {
      const data = await api.getAlbums();
      setAlbums(data);
    } catch (e) {
      statusHook.error('Error loading albums: ' + e.message);
    }
  }, []);

  const addAlbum = async (album) => {
    try {
      await api.addAlbum(album);
      statusHook.success('Album saved');
      fetchAlbums();
    } catch (e) {
      statusHook.error('Error saving album: ' + e.message);
    }
  };

  const updateAlbum = async (album) => {
    try {
      await api.updateAlbum(album);
      statusHook.success('Album saved');
      fetchAlbums();
    } catch (e) {
      statusHook.error('Error saving album: ' + e.message);
    }
  };

  const deleteAlbum = async (id) => {
    try {
      await api.deleteAlbum(id);
      statusHook.success('Album deleted');
      fetchAlbums();
    } catch (e) {
      statusHook.error('Error deleting album: ' + e.message);
    }
  };

  return { albums, fetchAlbums, addAlbum, updateAlbum, deleteAlbum };
}
