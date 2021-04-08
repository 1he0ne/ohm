const ActionBarSong = require('./actionBarSong');

function Song(data, view) {
  this.el = document.createElement('div');
  this.data = data;
  this.view = view;
  this.children = {};
  this.playing = app.player.playing && app.player.current.id === this.data.id;
  this.loading = app.player.loading && app.player.current.id === this.data.id;

  this.playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="408.5 238.5 183 183"><path fill="#EEE" stroke="#EEE" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" d="M443.75 255c-8.285 0-15 6.716-15 15h0v120c0 8.285 6.715 15 15 15h0l120-60c10-10 10-20 0-30h0l-120-60"/><path fill="none" d="M408.5 238.5h183v183h-183z"/></svg>';
  this.pauseIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="534.5 238.5 183 183"><path fill="#EEE" stroke="#EEE" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" d="M566 255h0v150h30V255h-30m120 0h0-30v150h30V255"/><path fill="none" d="M534.5 238.5h183v183h-183z"/></svg>'
  this.loadingIcon = '<div class="spinner"></div>';

  this.handlePlayButton = (e) => {
    e.stopPropagation();
    if (this.loading) return; //Ignore action if we are currently loading a song/album

    this.view === 'albumView' ? app.player.queueFiles(app.views.albumView.data, this.getPosition()) : app.player.queueFile(this.data);
  }

  this.handleArtistButton = (e) => {
    e.stopPropagation();
    if (this.view === 'artistView') return; //Prevent clicking artist forever

    app.addToHistory('artist', { artist: this.data.artist });
    app.changeView('artist', { artist: this.data.artist });
  }

  this.handleSongClick = (e) => {
    e.stopPropagation();
    if (view === 'songView') return; //Prevent clicking song forever

    app.addToHistory('song', { song: this.data, action: 'files' });
    app.changeView('song', { song: this.data, action: 'files' });
  }

  this.setPlayingState = (value) => {
    if (value) this.el.querySelector('.play-button').innerHTML = this.pauseIcon;
    else if (!value && (this.playing || this.loading)) this.el.querySelector('.play-button').innerHTML = this.playIcon;

    this.playing = value;
    this.loading = false;
  }

  this.triggerSpinner = () => {
    this.loading = true;
    this.el.querySelector('.play-button').innerHTML = this.loadingIcon;
  }

  this.getPosition = () => {
    return app.views.albumView.data.songs.indexOf(this.data);
  }

  this.reRender = () => {
    this.el.innerHTML = '';
    this.render();
  }

  this.render = async () => {
    try {
      //Create elements
      let main = document.createElement('div');
      let titleAndArtist = document.createElement('div');
      let artist = document.createElement('button');
      let separator = document.createElement('p');
      let title = document.createElement('p');
      let tag = document.createElement('p');
      let playButton = document.createElement('button');

      //Add classes for styling
      this.el.classList.add('song');
      main.classList.add('main');
      artist.classList.add('artist');
      titleAndArtist.classList.add('titleAndArtist');
      tag.classList.add('tag');
      separator.classList.add('separator');
      playButton.className = 'play-button';

      //Add attributes and innerHTML
      artist.innerHTML = this.data.artist;
      separator.innerHTML = '•';
      title.innerHTML = this.data.title;
      tag.innerHTML = '#' + this.data.tags[0];
      playButton.innerHTML = this.playing ? this.pauseIcon : this.playIcon;

      //Build structure
      this.el.appendChild(main);
      main.appendChild(playButton);
      main.appendChild(titleAndArtist);
      titleAndArtist.appendChild(artist);
      titleAndArtist.appendChild(separator);
      titleAndArtist.appendChild(title);
      main.appendChild(tag);

      //Add action bar
      if (this.view === 'songView') {
        //Do nothing
      }
      else {
        let actionBar = new ActionBarSong(this.data);
        this.children.actionBar = actionBar;
        this.el.appendChild(await actionBar.render());
      }

      //Add listeners
      this.el.onclick = this.handleSongClick;
      playButton.onclick = this.handlePlayButton;
      artist.onclick = this.handleArtistButton;

      app.songs.push(this); //Store song reference in global state
      return this.el;
    }
    catch (err) {
      console.error(err);
    }
  }
}

module.exports = Song;
