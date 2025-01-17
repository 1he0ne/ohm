'use strict';

const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const log = require('./log');

const addSong = async (song, path) => {
  try {
    const buffer = await fsp.readFile(song.path);
    const { cid } = await app.ipfs.add({ content: buffer }, { cidVersion: 1 }); //Add song to IPFS

    //Copy song to MFS
    await app.ipfs.files.mkdir(`${path}/${song.title}/files`, { parents: true, cidVersion: 1 });
    await app.ipfs.files.cp(`/ipfs/${cid.toString()}`, `${path}/${song.title}/${app.artist} - ${song.title}.${song.format}`, { cidVersion: 1 });

    //Add files
    for (const file of song.files) {
      if (file.type === 'internal') {
        const _file = await getFile(file.id);

        //Copy file to MFS
        await app.ipfs.files.cp(`/ipfs/${_file.cid}`, `${path}/${song.title}/files/${_file.artist} - ${_file.name}.${_file.format}`, { cidVersion: 1 });
        file.cid = _file.cid;
      }
      else {
        const buffer = await fsp.readFile(file.path);
        const { cid } = await app.ipfs.add({ content: buffer }, { cidVersion: 1 }); //Add song to IPFS

        //Copy file to MFS
        await app.ipfs.files.cp(`/ipfs/${cid.toString()}`, `${path}/${song.title}/files/${app.artist} - ${file.name}.${file.format}`, { cidVersion: 1 });
        file.cid = cid.toString();
      }
    }

    //Get CID of folder
    const folder = await app.ipfs.files.stat(`${path}/${song.title}`);
    song.cid = folder.cid.toString();
  }
  catch (err) {
    throw err;
  }
}

const generateTransferId = () => {
  const unique = crypto.randomBytes(6).toString('base64');//Generate unique ID
  if (app.transfersStore.get()[unique]) return generateTransferId(); //If the unique ID exists already, create a new one
  return unique;
}

const transferTimeout = (unique) => {
  return setTimeout(async () => {
    const transfer = app.transfersStore.getOne(unique);

    try {
      const stat = await app.ipfs.files.stat(`/ipfs/${transfer.cid}`, { withLocal: true, signal: transfer.controller.signal });
      const percentage = Math.round(stat.sizeLocal / stat.cumulativeSize * 100);
      if (percentage === 100) return;

      app.transfersStore.update(unique, { progress: percentage }); //Update progress in transfersStore
      if (app.current === 'transfers' && app.views.transfers) app.views.transfers.children[unique].update('progress'); //Update progress in transfersView
      app.transfersStore.update(unique, { timeout: transferTimeout(unique) }, true); //Add timeout to transfer in memory
    }
    catch (err) {
      if (app.transfersStore.getOne(unique).active) app.transfersStore.update(unique, { timeout: transferTimeout(unique) }, true); //Add timeout to transfer in memory
    }

  }, 1000);
}

const transferExists = (payload, type) => {
  const transfers = app.transfersStore.get();
  let unique = null;

  for (const _unique in transfers) {
    if (transfers[_unique].cid === payload.cid && transfers[_unique].albumTitle === payload.albumTitle && transfers[_unique].type === type) {
      unique = _unique;
      break;
    }
  }

  return unique;
}

const folderExists = async (transfer) => {
  try {
    //Check if album folder exists when dealing with a song inside an album
    if (transfer.albumTitle) {
      const albumExists = await albumFolderExists(transfer);
      if (!albumExists) return false;
    }

    //Check if folder exists already
    for await (const folder of app.ipfs.files.ls(transfer.path)) {
      if (folder.name === transfer.title) {
        //Check if CIDs are equal
        const { cid } = await app.ipfs.files.stat(`${transfer.path}/${transfer.title}`);
        if (cid.toString() === transfer.cid) return true;
        await app.ipfs.files.rm(`${transfer.path}/${transfer.title}`, { recursive: true }); //If CIDs don't match delete the current folder as this means the song/album has been reuploaded
      }
    }

    return false
  }
  catch (err) {
    return false;
  }
}

const createAlbumFolder = async (transfer) => {
  try {
    //Check if folder exists already
    for await (const folder of app.ipfs.files.ls(`/${transfer.artist}/albums`)) {
      if (folder.name === transfer.albumTitle) return;
    }

    await app.ipfs.files.mkdir(transfer.path, { cidVersion: 1 });
  }
  catch (err) {
    throw err;
  }
}

const removeExistingAlbumFolder = async (transfer) => {
  try {
    //Check if folder exists already
    for await (const folder of app.ipfs.files.ls(`/${transfer.artist}/albums`)) {
      if (folder.name === transfer.title) return await app.ipfs.files.rm(`/${transfer.artist}/albums/${transfer.title}`, { recursive: true });
    }
  }
  catch (err) {
    throw err;
  }
}

const appendPinIcon = (cid) => {
  const songFound = appendPinIconToSong(cid);
  if (songFound) return; //Stop here if song is found
  appendPinIconToAlbum(cid);
}

const createMFSTransferPath = (payload) => {
  if (payload.type === 'album') return `/${payload.artist}/albums`;
  if (payload.albumTitle) return `/${payload.artist}/albums/${payload.albumTitle}`;
  return `/${payload.artist}/singles`;
}

const createFSPath = (downloadPath, transfer) => {
  const transferPath = transfer.path.split('/');
  return path.join(downloadPath, ...transferPath, transfer.title);
}

const writeToDisk = async (transfer) => {
  try {
    log('Writing to disk...')
    const downloadPath = app.settingsStore.getOne('DOWNLOAD_PATH');
    const downloadPathFull = createFSPath(downloadPath, transfer)
    await fsp.mkdir(downloadPathFull, { recursive: true });

    for await (const file of app.ipfs.get(transfer.cid)) {
      if (!file.content) continue;

      //Write file to disk
      const filePath = file.path.slice(file.path.indexOf('/') + 1); //Get rid of first /
      await fsCreateSongFolder(transfer, filePath); //Create song folder if it doesn't exist yet

      const stream = fs.createWriteStream(path.join(downloadPathFull, filePath));
      for await (const chunk of file.content) stream.write(chunk);
      stream.end();
    }
    log.success('Successfully downloaded item.')
  }
  catch (err) {
    throw err;
  }
}

const pinItem = async (transfer, controller) => {
  try {
    log('Pinning...')
    await app.ipfs.pin.add(`/ipfs/${transfer.cid}`, { signal: controller.signal, cidVersion: 1 });
    if (transfer.albumTitle) await createAlbumFolder(transfer); //Create an album folder if needed
    if (transfer.album) await removeExistingAlbumFolder(transfer); //Check if folder exists and remove it
    await app.ipfs.files.cp(`/ipfs/${transfer.cid}`, `${transfer.path}/${transfer.title}`, { signal: controller.signal, parents: true, cidVersion: 1 });
    log('Successfully pinned item.');
  }
  catch (err) {
    throw err;
  }
}

const removePin = async (cid) => {
  try {
    for await (const pin of app.ipfs.pin.ls({ type: 'recursive' })) {
      if (pin.cid.toString() === cid) await app.ipfs.pin.rm(pin.cid, { recursive: true }); //Remove pin from IPFS
    }
  }
  catch (err) {
    return; //Ignore as this means that the file is no longer pinned already
  }
}

const garbageCollect = async () => {
  try {
    for await (const res of app.ipfs.repo.gc()) continue;
  }
  catch (err) {
    throw err;
  }
}

const childIsPlaying = (song, songs) => { //Check if a song within an album is playing
  for (let _song of songs) if (_song.id === song.id && song.type === _song.type) return true;
  return false;
}

const removeItem = (data) => {
  const appItems = app[`${data.type}s`]; //Either app.songs or app.albums, depending on data.type

  for (const item of appItems) if (item.data.id === data.id) { //Delete item from app.songs or app.albums
    item.el.remove();
    appItems.splice(appItems.indexOf(item), 1);
    break;
  }
}

const handleReader = async (reader, previous) => {
  try {
    const { done, value } = await reader.read();
    var msg = new TextDecoder().decode(value);
    if (done) return JSON.parse(previous);

    if (!msg.startsWith('{')) app.views.upload.updateProgress(msg); //Update progress in DOM
    return await handleReader(reader, msg);
  }
  catch (err) {
    throw err;
  }
}

const formatBytes = (bytes, decimals = 2) => { //Taken from https://stackoverflow.com/a/18650828
  if (!bytes || bytes < 1) return '0 B/s';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i] + '/s';
}

const handleEmpty = (el) => {
  const _el = document.createElement('div');
  _el.textContent = 'no items found';
  _el.className = 'empty';

  app.content.innerHTML = '';
  el.appendChild(_el);
  return app.content.appendChild(el);
}

const timerPromise = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

const allowedFormat = (string) => {
  if (string.length === 0) return false;

  const regex = /^[\w ]+$/;
  return regex.test(string);
}

//
//PRIVATE FUNCTIONS
//
const updatePinnedState = (actionBar) => {
  actionBar.pinned = true; //Update pinned state
  actionBar.el.querySelector('.pin').textContent = 'unpin'; //Update .pin element
  actionBar.appendPinIcon(); //Append pin icon
}

const appendPinIconToSong = (cid) => {
  let amountPinned = 0; //Keep track of how many songs are pinned in order to update album pin status
  let songFound = false //Keep track of whether or not a song was found before checking the albums

  for (const song of app.songs) { //Check songs
    const actionBar = song.children.actionBar;

    if (song.data.cid === cid && song.children.actionBar) {
      songFound = true;
      if (!actionBar.pinned) updatePinnedState(actionBar);
    }
    if (actionBar.pinned) amountPinned++;
  }

  if (app.current === 'album' && songFound && amountPinned === app.songs.length) { //If all songs in album view are pinned, update the pin state of album as well
    const actionBar = app.albums[0].children.actionBar;
    if (!actionBar.pinned) updatePinnedState(actionBar);
  }
  if (songFound) return true;
}

const appendPinIconToAlbum = (cid) => {
  for (const album of app.albums) {
    if (album.data.cid === cid && album.children.actionBar) {
      const actionBar = album.children.actionBar;

      if (!actionBar.pinned) updatePinnedState(actionBar);
      if (app.current !== 'album') return; //Stop here if not currently in albumView

      //Append icon to all songs as well
      for (const song of app.songs) {
        const actionBar = song.children.actionBar;
        if (actionBar.pinned) continue; //If songs is already pinned move on
        updatePinnedState(actionBar);
      }
    }
  }
}

const albumFolderExists = async (transfer) => {
  try {
    const path = transfer.path.slice(0, transfer.path.lastIndexOf('/')); //Format path to not include albumTitle
    for await (const folder of app.ipfs.files.ls(path)) {
      if (folder.name === transfer.albumTitle) {
        return true;
      }
    }
    return false;
  }
  catch (err) {
    return false;
  }
}

const fsCreateSongFolder = async (transfer, filePath) => {
  try {
    const downloadPath = app.settingsStore.getOne('DOWNLOAD_PATH');

    if (transfer.album) {
      const songTitle = filePath.slice(0, filePath.indexOf('/'));
      const _path = path.join(createFSPath(downloadPath, transfer), songTitle, 'files')
      if (!fs.existsSync(_path)) await fsp.mkdir(_path, { recursive: true });
    }
    else {
      const _path = path.join(createFSPath(downloadPath, transfer), 'files');
      if (!fs.existsSync(_path)) await fsp.mkdir(_path, { recursive: true });
    }
  }
  catch (err) {
    throw err;
  }
}

const getFile = async (id) => {
  try {
    const _res = await fetch(`${app.URL}/file/${id}`, {
      method: 'GET',
      credentials: 'include', //Include cookie
    });

    if (_res.status !== 200) throw new Error('FETCH_ERR');
    const res = await _res.json();
    if (res.type === 'error') throw new Error(res.err);

    return res.payload;
  }
  catch (err) {
    throw err;
  }
}

module.exports = {
  addSong,
  generateTransferId,
  transferTimeout,
  transferExists,
  folderExists,
  createAlbumFolder,
  removeExistingAlbumFolder,
  appendPinIcon,
  createMFSTransferPath,
  writeToDisk,
  pinItem,
  removePin,
  garbageCollect,
  childIsPlaying,
  removeItem,
  handleReader,
  formatBytes,
  handleEmpty,
  timerPromise,
  allowedFormat
}
