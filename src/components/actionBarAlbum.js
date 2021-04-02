const ipfs = require('../utils/ipfs');
const log = require('../utils/log');

function ActionBarAlbum(data) {
  this.el = document.createElement('div');
  this.data = data;
  this.pinned = false;

  this.pinIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="598.5 258.5 183 183"><path fill="none" stroke="#BBB" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" d="M720 350h0v30l45-45-45-45v30h-30m-30 30h0v-30l-45 45 45 45v-30h30m-30-30h60"/><path fill="none" d="M598.5 258.5h183v183h-183v-183z"/></svg></svg>'

  this.handlePinClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      log('Initiating transfer..');

      if (this.pinned) {
        await ipfs.unpinAlbum(this.data)
        this.removePinIcon();
      }
      else await ipfs.pinAlbum(this.data);

      log.success(`Album ${this.pinned ? 'pinned' : 'unpinned'}`);
    }
    catch (err) {
      console.error(err);
    }
  }

  this.appendPinIcon = () => {
    const icon = document.createElement('div');
    icon.className = 'pin-icon';
    icon.innerHTML = this.pinIcon;
    this.el.appendChild(icon);
  }

  this.removePinIcon = () => {
    this.pinned = false; //Update pin state
    this.el.querySelector('.pin').innerHTML = 'pin'; //Update .pin element
    this.el.querySelector('.pin-icon').remove(); //Remove pin icon

    //Remove pin icon from songs if in albumView
    if (app.current === 'album') {
      for (const song of app.songs) {
        const actionBar = song.children.actionBar;

        actionBar.pinned = false; //Update pinned state
        actionBar.el.querySelector('.pin').innerHTML = 'pin'; //Update .pin element
        actionBar.removePinIcon(); //Remove icon
      }
    }
  }

  this.checkIfPinned = async () => {
    try {
      if (await ipfs.artistExists(this.data.artist) === false) return false; //Check if artist folder exists
      const cid = await ipfs.albumExists(this.data) //Get CID
      if (!cid || cid !== this.data.cid) return false; //Check if CID matches

      return true;
    }
    catch (err) {
      console.error(err)
    }
  }

  this.render = async () => {
    try {
      //Check if album is pinned
      this.pinned = await this.checkIfPinned();

      //Create elements
      let songs = document.createElement('button');
      let pin = document.createElement('button');
      let download = document.createElement('button');

      //Add classes for styling
      this.el.className = 'actions';
      pin.className = 'pin';

      //Add attributes and innerHTML
      songs.innerHTML = `${this.data.songs.length} songs`;
      pin.innerHTML = this.pinned ? 'unpin' : 'pin';
      download.innerHTML = 'download';

      //Build structure
      this.el.appendChild(songs);
      this.el.appendChild(pin);
      this.el.appendChild(download);

      //Add pin icon if applicable
      if (this.pinned) this.appendPinIcon();

      //Add listeners
      pin.onclick = this.handlePinClick;

      return this.el;
    }
    catch (err) {
      console.error(err);
    }
  }
}

module.exports = ActionBarAlbum;
