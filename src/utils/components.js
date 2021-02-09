const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="408.5 238.5 183 183"><path fill="#EEE" stroke="#EEE" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" d="M443.75 255c-8.285 0-15 6.716-15 15h0v120c0 8.285 6.715 15 15 15h0l120-60c10-10 10-20 0-30h0l-120-60"/><path fill="none" d="M408.5 238.5h183v183h-183z"/></svg>';
const pauseIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="534.5 238.5 183 183"><path fill="#EEE" stroke="#EEE" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" d="M566 255h0v150h30V255h-30m120 0h0-30v150h30V255"/><path fill="none" d="M534.5 238.5h183v183h-183z"/></svg>'

const createSongElement = (_song, songView) => {
  //Helper functions - possibly move outside component?
  const toggleSounds = (e, song) => {
    e.stopPropagation();
    if (song.children[1].className === 'files-hidden') return song.children[1].className = 'files-visible';
    return song.children[1].className = 'files-hidden';
  }

  const handlePlayButton = (e, song) => {
    e.stopPropagation();
    client.playing ? e.target.innerHTML = playIcon : e.target.innerHTML = pauseIcon;
    client.player.queueFile(song)
  }

  //Create elements
  let song = document.createElement('div');
  let main = document.createElement('div');
  let titleAndArtist = document.createElement('div');
  let artist = document.createElement('p');
  let separator = document.createElement('p');
  let title = document.createElement('p');
  let playButton = document.createElement('button');

  //Add classes for styling
  song.classList.add('song');
  main.classList.add('main');
  titleAndArtist.classList.add('titleAndArtist');
  separator.classList.add('separator');

  //Add attributes and innerHTML
  artist.innerHTML = _song.artist;
  separator.innerHTML = '•';
  title.innerHTML = _song.title;
  playButton.innerHTML = playIcon;

  //Add file elements
  //for (let file of _song.files) {
  //  const el = createFileElement(file);
  //  files.appendChild(el);
  //}

  //Add actions
  let actions = createActionsElement(_song);

  //Build structure
  song.appendChild(main);
  song.appendChild(actions);
  main.appendChild(playButton);
  main.appendChild(titleAndArtist);
  titleAndArtist.appendChild(artist);
  titleAndArtist.appendChild(separator);
  titleAndArtist.appendChild(title);

  //Add listeners
  song.onclick = () => {
    client.addToHistory('song', _song);
    client.changeView('song', _song);
  }
  //toggle.onclick = (e) => toggleSounds(e, song);
  playButton.onclick = (e) => handlePlayButton(e, _song);

  return song;
}

const createAlbumElement = (_album) => {
  //Create elements
  let album = document.createElement('div');
  let main = document.createElement('div');
  let titleAndArtist = document.createElement('div');
  let art = document.createElement('img');
  let title = document.createElement('p');
  let artist = document.createElement('p');
  let playButton = document.createElement('button');

  //Add classes for styling
  album.classList.add('album');
  main.classList.add('main');
  titleAndArtist.classList.add('titleAndArtist');
  art.classList.add('art');

  //Add attributes and innerHTML
  art.setAttribute('src', `http://127.0.0.1:8080${_album.art}`)
  title.innerHTML = _album.title;
  artist.innerHTML = _album.artist;
  playButton.innerHTML = 'play/pause';

  //Build structure
  album.appendChild(main);
  main.appendChild(art);
  main.appendChild(titleAndArtist);
  titleAndArtist.appendChild(title);
  titleAndArtist.appendChild(artist);
  main.appendChild(playButton);

  //Add listeners
  album.onclick = () => client.selectAlbum(_album);
  playButton.onclick = () => client.player.queueFiles(_album.songs);

  return album;
}

const createFileElement = (_file) => {
  //Create elements
  let file = document.createElement('div');
  let name = document.createElement('p');
  let artist = document.createElement('p'); let playButton = document.createElement('button');
  file.classList.add('file');

  //Add attributes and innerHTML
  name.innerHTML = _file.name;
  artist.innerHTML = _file.artist;
  playButton.innerHTML = 'play/pause';

  //Build structure
  file.appendChild(artist);
  file.appendChild(name);
  file.appendChild(playButton);

  //Add listeners
  playButton.onclick = () => client.player.queueFile(_file);

  return file;
}

const createSongViewElement = (_song) => {
  let songView = document.createElement('div');
  let song = createSongElement(_song, true);

  songView.appendChild(song);

  return songView;
}

const createActionsElement = (song) => {
  //Create elements
  let actions = document.createElement('div');
  let files = document.createElement('button');
  let comments = document.createElement('button');
  let pins = document.createElement('button');
  let download = document.createElement('button');

  //Add attributes and innerHTML
  actions.className = 'actions';
  files.innerHTML = `${song.files.length} files`;
  comments.innerHTML = `${song.comments.length} comments`;
  pins.innerHTML = `${song.pins.length} pins`;
  download.innerHTML = 'download';

  //Build structure
  actions.appendChild(files);
  actions.appendChild(comments);
  actions.appendChild(pins);
  actions.appendChild(download);

  //Add listeners

  return actions;
}

module.exports = {
  createSongElement,
  createAlbumElement,
  createFileElement,
  createSongViewElement
}
