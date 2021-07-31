const Song = require('../components/song');
const SongViewMain = require('../components/songViewMain');

function SongView(data, action) {
  this.el = document.createElement('div');
  this.data = data;
  this.action = action;
  this.children = {
    files: {},
    main: null
  };

  this.refresh = async () => {
    try {
      const _res = await fetch(`${app.URL}/api/song/${this.data.id}`);
      const res = await _res.json();
      if (res.type === 'error') throw new Error(res.err);

      //Re-initialize state
      this.data = res.payload;
      this.children = {
        files: {},
        main: null
      }
      app.songs = []; //Remove old song from global app.songs

      await this.render();
    }
    catch (err) {
      throw err;
    }
  }

  this.render = async () => {
    try {
      this.el.innerHTML = '' //Reset innerHTML
      let action = this.action || 'files';

      //Create elements
      let song = new Song(this.data, 'song');
      this.children.main = new SongViewMain(this.data, action);
      let createdAt = document.createElement('div');
      let description = document.createElement('pre');

      //Add classes for styling
      this.el.className = `song-view-${this.action}`;
      createdAt.className = 'created-at';
      description.className = 'description';

      //Add attributes and innerHTML
      createdAt.textContent = this.data.createdAt;
      description.textContent = this.data.description;

      this.el.appendChild(await song.render());
      this.el.appendChild(createdAt);
      this.el.appendChild(description);
      this.el.appendChild(this.children.main.render());

      app.content.innerHTML = '';
      app.content.appendChild(this.el);
    }
    catch (err) {
      throw err;
    }
  }
}

module.exports = SongView;
