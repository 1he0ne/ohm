let testData = [];

let demoFile1 = {
  id: 'aaa',
  type: 'original',
  fileType: 'wav',
  name: 'demo1',
  artist: 'testArtist',
  url: '/ipfs/QmQpbUHhJgq7JeFMGDjXP22cREPYaMGa5TZnZ48dHDFQgc',
  tags: ['kick', 'hiphop']
}

let demoFile2 = {
  id: 'bbb',
  type: 'internal',
  fileType: 'wav',
  name: 'demo2',
  artist: 'testArtist',
  url: '/ipfs/QmTp7eeKm1ymt6SZD3SPMD3mKkAFomE8x5xtJhqK48a8qy',
  tags: ['snare', 'hiphop']
}

let demoFile3 = {
  id: 'ccc',
  type: 'internal',
  fileType: 'wav',
  name: 'demo3',
  artist: 'testArtistX',
  url: '/ipfs/QmU1B9JdMvhm4EB8kj487GfwQzfVtocKCm9XNAHkUtHz4f',
  tags: ['snare', 'hiphop']
}

let demoSong = {
  id: 'ddd',
  type: 'song',
  fileType: 'mp3',
  title: 'testTitle1',
  artist: 'testArtist1',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmU1B9JdMvhm4EB8kj487GfwQzfVtocKCm9XNAHkUtHz4f',
  files: [ demoFile1, demoFile2, demoFile3 ],
  comments: ['hi', 'ho'],
  pins: ['1', '2'],
  tags: ['lofi', 'hiphop']
}

let demoSong2 = {
  id: 'eee',
  type: 'song',
  fileType: 'wav',
  title: 'testTitle2',
  artist: 'testArtist2',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmTp7eeKm1ymt6SZD3SPMD3mKkAFomE8x5xtJhqK48a8qy',
  files: [ demoFile1, demoFile2 ],
  comments: ['he', 'ha'],
  pins: ['3', '4'],
  tags: ['lofi', 'hiphop']
}

let demoSong3 = {
  id: 'fff',
  type: 'song',
  fileType: 'wav',
  title: 'testTitle3',
  artist: 'testArtist3',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmTp7eeKm1ymt6SZD3SPMD3mKkAFomE8x5xtJhqK48a8qy',
  files: [ demoFile1, demoFile2 ],
  comments: ['he', 'ha'],
  pins: ['3', '4'],
  tags: ['lofi', 'hiphop']
}

let demoSong4 = {
  id: 'ggg',
  type: 'song',
  fileType: 'wav',
  title: 'testTitle4',
  artist: 'testArtist4',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmTp7eeKm1ymt6SZD3SPMD3mKkAFomE8x5xtJhqK48a8qy',
  files: [ demoFile1, demoFile2 ],
  comments: ['he', 'ha'],
  pins: ['3', '4'],
  tags: ['lofi', 'hiphop']
}

let demoSong5 = {
  id: 'fff',
  type: 'song',
  fileType: 'wav',
  title: 'testTitle5',
  artist: 'testArtist5',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmTp7eeKm1ymt6SZD3SPMD3mKkAFomE8x5xtJhqK48a8qy',
  files: [ demoFile1, demoFile2 ],
  comments: ['he', 'ha'],
  pins: ['3', '4'],
  tags: ['lofi', 'hiphop']
}

let demoSong6 = {
  id: 'ggg',
  type: 'song',
  fileType: 'wav',
  title: 'testTitle6',
  artist: 'testArtist6',
  art: '/ipfs/QmWVc2saSwaTy7h3j6idN8U2jL6kqhMsoReFsf56vwfXr6',
  url: '/ipfs/QmU1B9JdMvhm4EB8kj487GfwQzfVtocKCm9XNAHkUtHz4f',
  files: [ demoFile1, demoFile2 ],
  comments: ['he', 'ha'],
  pins: ['3', '4'],
  tags: ['lofi', 'hiphop']
}

testData.push(demoSong);
testData.push(demoSong2);

let demoAlbum1 = {
  id: 'hhh',
  type: 'album',
  title: 'testAlbumTitle',
  artist: 'testAlbumArtist',
  songs: [demoSong3, demoSong4],
  url: '/ipfs/QmU1B9JdMvhm4EB8kj487GfwQzfVtocKCm9XNAHkUtHz4f',
  tags: ['edm', 'dub']
};

let demoAlbum2 = {
  id: 'iii',
  type: 'album',
  title: 'testAlbumTitle',
  artist: 'testAlbumArtist',
  songs: [demoSong5, demoSong6],
  url: '/ipfs/QmU1B9JdMvhm4EB8kj487GfwQzfVtocKCm9XNAHkUtHz4f',
  tags: ['edm', 'dub']
};


testData.push(demoAlbum1);
testData.push(demoAlbum2);

testArtist = {
  id: 'aaa',
  name: 'testArtist',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  location: 'earth',
  songs: [demoSong, demoSong2],
  albums: [demoAlbum1, demoAlbum2]
}

module.exports = {
  testData,
  testArtist
};