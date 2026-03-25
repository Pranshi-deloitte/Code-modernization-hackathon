import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlbumsPage from './AlbumsPage';
import * as api from '../api/albums';

const mockAlbums = [
  { id: '1', title: 'Abbey Road', artist: 'The Beatles', releaseYear: '1969', genre: 'Rock', trackCount: 17, albumId: '' },
  { id: '2', title: 'Thriller', artist: 'Michael Jackson', releaseYear: '1982', genre: 'Pop', trackCount: 9, albumId: '' },
  { id: '3', title: 'Nevermind', artist: 'Nirvana', releaseYear: '1991', genre: 'Rock', trackCount: 13, albumId: '' },
  { id: '4', title: 'Rumours', artist: 'Fleetwood Mac', releaseYear: '1977', genre: 'Rock', trackCount: 11, albumId: '' }
];

beforeEach(() => {
  vi.spyOn(api, 'getAlbums').mockResolvedValue(mockAlbums);
  vi.spyOn(api, 'addAlbum').mockResolvedValue({ id: 'new', ...mockAlbums[0] });
  vi.spyOn(api, 'updateAlbum').mockResolvedValue(mockAlbums[0]);
  vi.spyOn(api, 'deleteAlbum').mockResolvedValue({});
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AlbumsPage />
    </MemoryRouter>
  );
}

describe('AlbumsPage — US-1 View Album Catalog', () => {
  it('AC-1: renders Albums heading', async () => {
    renderPage();
    expect(await screen.findByText('Albums')).toBeInTheDocument();
  });

  it('AC-2: shows title, artist, year and genre for each album', async () => {
    renderPage();
    expect(await screen.findByText('Abbey Road')).toBeInTheDocument();
    expect(screen.getByText('The Beatles')).toBeInTheDocument();
    expect(screen.getByText('1969')).toBeInTheDocument();
    expect(screen.getAllByText('Rock').length).toBeGreaterThan(0);
  });

  it('AC-3: toggles between grid and list view', async () => {
    renderPage();
    await screen.findByText('Abbey Road');

    // Switch to list view
    fireEvent.click(screen.getByTitle('List view'));
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Switch back to grid view
    fireEvent.click(screen.getByTitle('Grid view'));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('AC-4: loads all albums from API on mount', async () => {
    renderPage();
    await screen.findByText('Abbey Road');
    expect(api.getAlbums).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Rock|Pop/).length).toBeGreaterThan(0);
  });
});
