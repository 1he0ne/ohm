const io = require('../utils/io');
const ipfs = require('../utils/ipfs');
const log = require('../utils/log');

function Transfer(data, unique) {
  this.el = document.createElement('tr');
  this.data = data;
  this.unique = unique; //Store transfer's unique key

  this.update = (value) => {
    this.data = app.transfersStore.getOne(this.unique); //Update data
    if (value === 'progress') this.el.querySelector(`.${value}`).innerHTML = this.data[value] + '%'; //Update DOM
    else this.el.querySelector(`.${value}`).innerHTML = this.data[value]; //Update DOM
  }

  this.handleComplete = () => {
    this.data.completed = true;
    this.el.querySelector('.completed').innerHTML = 'COMPLETED';
    this.el.querySelector('button').remove();
  }

  this.handleResume = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (this.data.active) { //If active pause
        this.el.querySelector(`.resume`).innerHTML = 'resume'; //Update DOM
        ipfs.pauseTransfer(this.unique);
        log.success('Successfully paused.');
        return;
      }

      switch (this.data.type) {
        case 'pin':
          log('Innitiating transfer..');
          this.el.querySelector(`.resume`).innerHTML = 'pause'; //Update DOM
          await ipfs.resumeTransfer(this.unique);
          break;
        case 'download':
          log('Innitiating transfer..');
          this.el.querySelector(`.resume`).innerHTML = 'pause'; //Update DOM
          await ipfs.resumeTransfer(this.unique);
          break;
        default:
          console.error('Unknown command.');
      }
    }
    catch (err) {
      console.error(err);
    }
  }

  this.handleClear = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      await ipfs.clearTransfer(this.unique);
    }
    catch (err) {
      console.error(err);
    }

  }

  this.reRender = () => {
    this.data = app.transfersStore.getOne(this.unique); //Update data
    this.el.innerHTML = '';
    this.render();
  }

  this.render = () => {
    //Create elements
    const artist = document.createElement('td');
    const title = document.createElement('td');
    const type = document.createElement('td');
    const progress = document.createElement('td');
    const completed = document.createElement('td');
    const resumeCell = document.createElement('td');
    const resume = document.createElement('button');
    const clearCell = document.createElement('td');
    const clear = document.createElement('button');

    //Add classes for styling
    this.el.className = 'transfer';
    progress.className = 'progress';
    completed.className = 'completed';
    resume.className = 'resume';

    //Add attributes and innerHTML
    artist.innerHTML = this.data.artist;
    title.innerHTML = this.data.title;
    type.innerHTML = this.data.type;
    progress.innerHTML = this.data.progress + '%';
    resume.innerHTML = this.data.active ? 'pause' : 'resume';
    resume.disabled = this.data.completed ? true : false;
    clear.innerHTML = 'clear';
    completed.innerHTML = this.data.completed ? 'COMPLETED' : 'INCOMPLETE';

    //Build structure
    this.el.appendChild(artist);
    this.el.appendChild(title);
    this.el.appendChild(type);
    this.el.appendChild(progress);
    this.el.appendChild(completed);
//    if (!this.data.completed) this.el.appendChild(resume);
    resumeCell.appendChild(resume);
    this.el.appendChild(resumeCell);
    clearCell.appendChild(clear);
    this.el.appendChild(clearCell);

    //Add listeners
    resume.onclick = this.handleResume;
    clear.onclick = this.handleClear;

    return this.el;
  }
}

module.exports = Transfer;
