const ipfs = require('../utils/ipfs');
const log = require('../utils/log');
const { backIcon, forwardIcon, refreshIcon } = require('../utils/svgs');

function Header() {
  this.el = document.querySelector('.header');
  this.backButton = null;
  this.forwardButton = null;

  this.handleBack = () => {
    let index = app.historyIndex - 1;

    //Handle first item in list
    if (index < 0) {
      return console.log('at first index already');
    }

    //Handle index at 0
    if (index === 0) this.backButton.className = 'disabled';

    this.forwardButton.className = 'enabled';
    let view = app.history[index];

    switch (view.type) {
      case 'song':
        app.historyIndex--;
        return app.changeView(view.type, view.data);
      case 'album':
        app.historyIndex--;
        return app.changeView(view.type, view.data);
      case 'artist':
        app.historyIndex--;
        return app.changeView(view.type, view.data);
      case 'upload':
        app.historyIndex--;
        return app.changeView(view.type, view.data);
      default:
        app.historyIndex--;
        app.nav.select(view.type)
        return app.changeView(view.type, view.data);
    }
  }

  this.handleForward = () => {
    let index = app.historyIndex + 1;

    //Handle last item in list
    if (index > app.history.length - 1) {
      return console.log('at last index already')
    }

    //Handle index at last position
    if (index === app.history.length - 1) {
      this.forwardButton.className = 'disabled';
    }

    this.backButton.className = 'enabled';
    let view = app.history[index];
    switch (view.type) {
      case 'song':
        app.historyIndex++;
        return app.changeView(view.type, view.data);
      case 'album':
        app.historyIndex++;
        return app.changeView(view.type, view.data);
      case 'artist':
        app.historyIndex++;
        return app.changeView(view.type, view.data);
      case 'upload':
        app.historyIndex++;
        return app.changeView(view.type, view.data);
      default:
        app.historyIndex++;
        app.nav.select(view.type)
        return app.changeView(view.type);
    }
  }

  this.handleRefresh = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (app.views[app.current].refresh) app.views[app.current].refresh();
  }

  this.handleTest = async () => {
    //app.logout();
    try {
      const _res = await fetch(`${app.URL}/test`);
      const reader = _res.body.getReader();
      reader.read().then(function processText({ done, value }) {
          // Result objects contain two properties:
          // done  - true if the stream has already given you all its data.
          // value - some data. Always undefined when done is true.
          if (done) {
            console.log("Stream complete");
            return;
          }

          // value for fetch streams is a Uint8Array
          // Read some more, and call this function again
          var string = new TextDecoder().decode(value);
          console.log(string)
          return reader.read().then(processText);
        });
    }
    catch (err) {
      log.error(err)
    }
  }

  this.handleUpload = () => {
    app.addToHistory('upload');
    return app.changeView('upload');
  }

  this.render = () => {
    //Create elements
    let back = document.createElement('button');
    let forward = document.createElement('button');
    let refresh = document.createElement('button');
    let right = document.createElement('div');
    let upload = document.createElement('button');
    let test = document.createElement('button');

    //Add innerHTML
    back.innerHTML = backIcon;
    forward.innerHTML = forwardIcon;
    refresh.innerHTML = refreshIcon;
    upload.innerHTML = 'upload';
    test.innerHTML = 'test';

    //Add classes
    forward.classList.add('disabled');
    back.classList.add('disabled');
    refresh.className = 'refresh';
    right.classList.add('header-right');

    //Add listeners
    back.onclick = this.handleBack;
    forward.onclick = this.handleForward;
    refresh.onclick = this.handleRefresh;
    upload.onclick = this.handleUpload;
    test.onclick = this.handleTest;

    //Create reference
    this.backButton = back;
    this.forwardButton = forward;

    this.el.appendChild(back);
    this.el.appendChild(forward);
    this.el.appendChild(refresh);
    this.el.appendChild(right);
    right.appendChild(upload);
    right.appendChild(test);
  }
}

module.exports = Header;
