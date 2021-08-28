const { app, BrowserWindow, ipcMain, Menu, Tray, nativeTheme } = require('electron');
const { spawn } = require('child_process')
const path = require('path');
const fs = require('fs');
let tray = null; //Menu icon
let daemon = null; //IPFS daemon
const userDataPath = app.getPath('userData'); //Check if config / transfers files exist
let tempUploadPath = null; //True while upload is active
let win = null; //Main window
let view = null; //Which view should we open with ('explore' being default)
let quitting = false; //Is the app in the process of quitting

const DEFAULT_SETTINGS = {
  DOWNLOAD_PATH: path.join(process.env.HOME, 'Documents', 'ohm'),
  IPFS_PROTOCOL: 'http',
  IPFS_HOST: 'localhost',
  IPFS_PORT: 5001,
  IPFS_PATH: 'api/v0',
  OS_THEME: 'system'
}

function createWindow() {
  if (win) return win.show(); //Ignore if window is already created

  win = new BrowserWindow({
    width: 800,
    height: 360,
    minWidth: 480,
    minHeight: 300,
    backgroundColor: "#222",
    icon: path.join(__dirname, 'src', 'assets', 'icon', { darwin: 'icon.icns', linux: 'icon.png', win32: 'icon.ico'  }[process.platform] || 'icon.ico'),
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    trafficLightPosition: { x: 9, y: 6 },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.platform === 'darwin') app.dock.show();
  win.webContents.openDevTools();
  win.webContents.on('devtools-opened', () => {
    win.loadFile('src/index.html')
  });
  win.once('closed', () => win = null);
}

app.whenReady().then(() => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') app.dock.hide();
})

app.on('will-quit', async (e) => {
  quitting = true;

  if (tempUploadPath) { //If a file is currently being uploaded make sure to delete MFS before quitting
    e.preventDefault();

    try {
      await clearUploadMFS(); //Clear MFS
      daemon.kill();
    }
    catch (err) {
      console.log(err);
      daemon.kill();
    }
  }
  else if (daemon) {
    e.preventDefault();
    daemon.kill();
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

//IPC events
ipcMain.on('start', (event) => {
  process.env.IPFS_PATH = path.join(process.env.HOME, '.ohm-ipfs'); //Set IPFS_PATH
  if (!fs.existsSync(path.join(userDataPath, 'transfers.json'))) fs.writeFileSync(path.join(userDataPath, 'transfers.json'), '{}');
  if (!fs.existsSync(path.join(userDataPath, 'settings.json'))) fs.writeFileSync(path.join(userDataPath, 'settings.json'), JSON.stringify(DEFAULT_SETTINGS, null, 2));

  if (daemon) { //Check if daemon is already running
    event.reply('daemon-ready', { userDataPath, view: view || 'explore' });
    return view = null; //Reset view to null
  }

  //Check if the repo exists already
  if (fs.existsSync(process.env.IPFS_PATH)) {
    spawnDaemon(event);
  }
  else {
    initRepo(event);
  }
});

ipcMain.on('upload-start', (event, arg) => { //When upload starts, make note of MFS path so that we can delete it on force close during upload
  tempUploadPath = arg;
});

ipcMain.on('upload-end', (event) => { //Reset tempUploadPath when upload ends/fails
  tempUploadPath = null;
});

const spawnDaemon = (event) => {
  daemon = spawn(require('go-ipfs').path(), ['daemon', '--routing=dhtclient'])

  daemon.stdout.on('data', (data) => {
    console.log(`${data}`);
    if (data.toString().match(/(?:daemon is running|Daemon is ready)/)) {
      event.reply('daemon-ready', { userDataPath, view: 'explore' });

      //Update tray
      const contextMenu = Menu.buildFromTemplate(menuTemplate(true));
      tray.setContextMenu(contextMenu)
    }
  });

  daemon.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    win.webContents.send('ipfs-error', data);
  });

  daemon.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    daemon = null;

    if (quitting) return app.quit();

    //Update tray
    const contextMenu = Menu.buildFromTemplate(menuTemplate(false));
    tray.setContextMenu(contextMenu)
  });

  daemon.on('error', (err) => {
    console.log(err)
  })
}

const initRepo = (event) => {
  let init = spawn(require('go-ipfs').path(), ['init']);

  init.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  init.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  init.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    spawnDaemon(event);
  });

  init.on('error', (err) => {
    console.log(err)
  })
}

const clearUploadMFS = () => {
  return new Promise((resolve) => {
    let clearMFS = spawn(require('go-ipfs').path(), ['files', 'rm', '-r', tempUploadPath]);

    clearMFS.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    clearMFS.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    clearMFS.on('close', (code) => {
      console.log(`Successfully stopped current upload.`);
      tempUploadPath = null; //Reset tempUploadPath
      resolve();
    });

    clearMFS.on('error', (err) => {
      console.log(err);
      resolve();
    })
  });
}

const openSettings = () => {
  if (!win) {
    view = 'settings';
    return createWindow();
  }

  win.show();
  win.webContents.send('open-settings');
}

const menuTemplate = (running) => {
  return [
    { label: running ? 'Daemon is running...' : 'Daemon is not running...', type: 'normal', enabled: false },
    { label: 'Open ohm', type: 'normal', click: createWindow },
    { label: 'Settings', type: 'normal', click: openSettings },
    { type: 'separator' },
    { label: 'Quit', type: 'normal', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
  ];
}

const createTray = () => {
  const trayIconPath = getTrayIconPath();
  tray = new Tray(trayIconPath);
  const contextMenu = Menu.buildFromTemplate(menuTemplate(false));
  tray.setContextMenu(contextMenu)
}

const getTrayIconPath = () => {
  switch (process.platform) {
    case 'darwin':
      return path.join(__dirname, 'src', 'assets', 'tray', 'trayLightTemplate.png');
    case 'linux':
      if (fs.existsSync(path.join(userDataPath, 'settings.json'))) { //Check if user decided to overwrite default tray icon color
        const { OS_THEME } = JSON.parse(fs.readFileSync(path.join(userDataPath, 'settings.json')));
        if ( OS_THEME === 'dark' ) return path.join(__dirname, 'src', 'assets', 'tray', 'trayDark.png');
        else if ( OS_THEME === 'light' ) return path.join(__dirname, 'src', 'assets', 'tray', 'trayLightTemplate.png');
      }

      return path.join(__dirname, 'src', 'assets', 'tray', `tray${nativeTheme.shouldUseDarkColors ? 'Dark' : 'LightTemplate'}.png`);
    default:
      return path.join(__dirname, 'src', 'assets', 'tray', 'trayLightTemplate.png');
  }
}

