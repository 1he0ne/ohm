'use strict';

const helpers = require('./helpers');
const log = require('./log');

const uploadSingle = async (payload) => {
  try {
    const song = payload.songs[0];
    await helpers.addSong(song, `/${app.artist}/singles`);
  }
  catch (err) {
    throw err;
  }
}

const uploadAlbum = async (payload) => {
  try {
    const album = payload.album;
    await app.ipfs.files.mkdir(`/${app.artist}/albums/${album.title}`, { cidVersion: 1 });

    //Add songs
    for (const song of payload.songs) {
      await helpers.addSong(song,`/${app.artist}/albums/${album.title}`);
    }

    //Get CID of album folder
    const folder = await app.ipfs.files.stat(`/${app.artist}/albums/${album.title}`);
    album.cid = folder.cid.toString();
  }
  catch (err) {
    throw err;
  }
}

const startTransfer = async (payload, _options) => {
  const options = _options || {}; //Initialise the options object if not provided
  const unique = helpers.generateTransferId(); //Generate unique id for the transfer

  try {
    const type = options.download ? 'download' : 'pin';
    const _unique = helpers.transferExists(payload, type); //Check if transfer already exists
    if (_unique) return resumeTransfer(_unique);

    //Create transfer
    const controller = new AbortController(); //Create abort controller to abort pin.add
    const path = helpers.createMFSTransferPath(payload); //Create MFS path where the song/album will be stored
    const transfer = {
      title: payload.title,
      artist: payload.artist,
      albumTitle: payload.albumTitle,
      album: payload.type === 'album' ? true : null,
      path,
      cid: payload.cid,
      type,
      progress: 0,
      active: true, //Is the timeout active
      completed: false
    };

    app.transfersStore.add(unique, transfer); //Add transfer to transfersStore
    app.transfersStore.update(unique, { controller }, true); //Add controller to transfer in memory
    app.transfersStore.update(unique, { timeout: helpers.transferTimeout(unique) }, true); //Add timeout to transfer in memory
    log('Transfer initiated..');

    const folderExists = await helpers.folderExists(transfer); //Check if folder exists already
    if (!folderExists) await helpers.pinItem(transfer, controller); //Add to MFS
    if (transfer.type === 'download') await helpers.writeToDisk(transfer); //Download to file system if download option is specified

    const timeout = app.transfersStore.getOne(unique).timeout; //Clear timeout if running
    if (timeout) clearTimeout(timeout);

    app.transfersStore.update(unique, { active: false, completed: true, progress: 100 }); //Clean up transfer
    if (app.current === 'transfers' && app.views.transfers) app.views.transfers.children[unique].reRender(); //Update transfersView if applicable
    helpers.appendPinIcon(transfer.cid); //Update pin icon if applicable

    log.success('Transfer succesfully completed.');
  }
  catch (err) {
    const timeout = app.transfersStore.getOne(unique).timeout; //Clear timeout if running
    if (timeout) clearTimeout(timeout);

    throw err;
  }
}

const resumeTransfer = async (unique) => {
  try {
    const transfer = app.transfersStore.getOne(unique);
    const controller = new AbortController();

    //Perform checks before resuming a transfer
    if (transfer.active) throw new Error('Transfer is already active'); //Check if transfer is already active
    const folderExists = await helpers.folderExists(transfer); //Check if song/album folder exists already
    if (transfer.completed && folderExists && transfer.type === 'pin') throw new Error ('Transfer has already been completed'); //Check if item has already been pinned

    //Resume transfer
    app.transfersStore.update(unique, { active: true, completed: false });
    app.transfersStore.update(unique, { controller }, true); //Add controller to transfer in memory
    app.transfersStore.update(unique, { timeout: helpers.transferTimeout(unique) }, true); //Add timeout to transfer in memory
    log('Transfer initiated..');

    if (!folderExists) await helpers.pinItem(transfer, controller); //Add to MFS
    if (transfer.type === 'download') await helpers.writeToDisk(transfer); //Download to file system if download option is specified

    const timeout = app.transfersStore.getOne(unique).timeout; //Clear timeout if running
    if (timeout) clearTimeout(timeout);

    app.transfersStore.update(unique, { active: false, completed: true, progress: 100 }); //Clean up transfer
    if (app.current === 'transfers' && app.views.transfers) app.views.transfers.children[unique].reRender(); //Update transferView if applicable
    helpers.appendPinIcon(transfer.cid); //Update pin icon if applicable

    log.success('Transfer succesfully completed.');
  }
  catch (err) {
    throw err;
  }
}

const pauseTransfer = async (unique) => {
  try {
    const transfer = app.transfersStore.getOne(unique);

    //Pause transfer
    app.transfersStore.update(unique, { active: false });
    transfer.controller.abort();
    if (transfer.timeout) clearTimeout(transfer.timeout);
  }
  catch (err) {
    throw err;
  }
}

const clearTransfer = async (unique) => {
  try {
    const transfer = app.transfersStore.getOne(unique);
    if (!transfer.completed) {
      if (transfer.active) { //Stop transfer if it is currently active
        app.transfersStore.update(unique, { active: false });
        transfer.controller.abort();
        if (transfer.timeout) clearTimeout(transfer.timeout);
      }
      await helpers.garbageCollect(); //Remove any data saved to IPFS
    }

    app.transfersStore.rm(unique);
    return app.views.transfers.removeTransfer(unique);
  }
  catch (err) {
    throw err;
  }
}

const clearAllTransfers = async () => {
  try {
    const transfers = app.transfersStore.get();

    for (const unique in transfers) if (transfers[unique].completed) app.transfersStore.rm(unique);
    return app.views.transfers.removeAllTransfers();
  }
  catch (err) {
    throw err;
  }
}

const checkIfSongIsPinned = async (data) => {
  try {
    if (data.albumTitle) {
      if (await artistExists(data.artist) === false) return false; //Check if artist folder exists
      if (await albumExists(data) === false) return false; //Check if album folder exists

      const cid = await songInAlbumExists(data); //Get song CID
      if (!cid || cid !== data.cid) return false; //Check if CID matches
    }
    else {
      if (await artistExists(data.artist) === false) return false; //Check if artist folder exists

      const cid = await songExists(data); //Get song CID
      if (!cid || cid !== data.cid) return false; //Check if CID matches
    }
    return true;
  }
  catch (err) {
    log.error(err.message);
  }
}

const checkIfAlbumIsPinned = async (data) => {
  try {
    if (await artistExists(data.artist) === false) return false; //Check if artist folder exists
    const cid = await albumExists(data) //Get CID
    if (!cid || cid !== data.cid) return false; //Check if CID matches

    return true;
  }
  catch (err) {
    log.error(err.message)
  }
}

const unpinSong = async (payload) => {
  try {
    const path = payload.albumTitle ? `/${payload.artist}/albums/${payload.albumTitle}/` : `/${payload.artist}/singles/`;
    await app.ipfs.files.rm(`${path}${payload.title}`, { recursive: true });
    await helpers.removePin(payload.cid);
    log.success('Song unpinned.');
  }
  catch (err) {
    throw err;
  }
}

const unpinAlbum = async (payload) => {
  try {
    await app.ipfs.files.rm(`/${payload.artist}/albums/${payload.title}`, { recursive: true });
    await helpers.removePin(payload.cid);
    log.success('Album unpinned.');
  }
  catch (err) {
    throw err;
  }
}

const getPinned = async () => {
  try {
    const artists = [];
    const albums = [];
    const songs = [];

    for await (const file of app.ipfs.files.ls(`/`)) artists.push(file.name); //Get artists
    for (const artist of artists) {
      for await (const file of app.ipfs.files.ls(`/${artist}/albums`)) { //Get albums
        const stat = await app.ipfs.files.stat(`/${artist}/albums/${file.name}`);
        albums.push(stat.cid.toString());
      }
      for await (const file of app.ipfs.files.ls(`/${artist}/singles`)) {
        const stat = await app.ipfs.files.stat(`/${artist}/singles/${file.name}`);
        songs.push(stat.cid.toString());
      }
    }

    return { albums, songs };
  }
  catch (err) {
    log.error(err.message);
  }
}

const artistExists = async (artist) => {
  try {
    for await (const file of app.ipfs.files.ls('/')) {
      if (file.name === artist && file.type === 'directory') return true;
    }
    return false;
  }
  catch (err) {
    throw err;
  }
}

const songExists = async (data) => {
  try {
    for await (const file of app.ipfs.files.ls(`/${data.artist}/singles/`)) {
      if (file.name === data.title && file.type === 'directory') return file.cid.toString();
    }
    return false;
  }
  catch (err) {
    throw err;
  }
}

const albumExists = async (data) => {
  try {
    for await (const file of app.ipfs.files.ls(`/${data.artist}/albums/`)) {
      if (file.name === (data.albumTitle || data.title) && file.type === 'directory') return file.cid.toString();
    }
    return false;
  }
  catch (err) {
    throw err;
  }
}

const songInAlbumExists = async (data) => {
  try {
    for await (const file of app.ipfs.files.ls(`/${data.artist}/albums/${data.albumTitle}/`)) {
      if (file.name === data.title && file.type === 'directory') return file.cid.toString();
    }
    return false;
  }
  catch (err) {
    throw err;
  }
}

module.exports = {
  uploadSingle,
  uploadAlbum,
  startTransfer,
  resumeTransfer,
  pauseTransfer,
  clearTransfer,
  clearAllTransfers,
  checkIfSongIsPinned,
  checkIfAlbumIsPinned,
  unpinSong,
  unpinAlbum,
  getPinned,
  artistExists,
  songExists,
  albumExists,
  songInAlbumExists
}
