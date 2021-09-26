'use strict';

const { infoIcon } = require('../utils/svgs');
const { shell } = require('electron');

function UploadFile(data) {
  this.el = document.createElement('fieldset');
  this.data = data;

  //Elements
  this.name = null;
  this.id = null;
  this.tags = null;
  this.info = null;
  this.file = null;

  //Add unique id to file and increase fileCounter
  this.unique = app.views.upload.fileCounter;
  app.views.upload.fileCounter++;

  this.handleTypeChange = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (e.target.value === 'original' || e.target.value === 'external') {
      this.id.querySelector('input').disabled = true;
      this.id.querySelector('label').className = 'label-disabled';

      this.name.querySelector('input').disabled = false;
      this.name.querySelector('label').className = '';
      this.tags.querySelector('input').disabled = false;
      this.tags.querySelector('label').className = '';
      this.info.querySelector('input').disabled = false;
      this.info.querySelector('label').className = '';
      this.file.querySelector('input').disabled = false;
      this.file.querySelector('label').className = '';

      this.el.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
        if (checkbox.id === `BY-${this.unique}`) checkbox.disabled = false;
        else if (this.el.querySelector(`#BY-${this.unique}`).checked) checkbox.disabled = false;
      });
      this.el.querySelectorAll('.checkbox-group-div p').forEach(p => {
        p.className = '';
      });
      this.el.querySelectorAll('.checkbox-group-div label').forEach(label => {
        label.className = '';
      });
    }
    else if (e.target.value === 'internal') {
      this.id.querySelector('input').disabled = false;
      this.id.querySelector('label').className = '';

      this.name.querySelector('input').disabled = true;
      this.name.querySelector('label').className = 'label-disabled';
      this.tags.querySelector('input').disabled = true;
      this.tags.querySelector('label').className = 'label-disabled';
      this.info.querySelector('input').disabled = true;
      this.info.querySelector('label').className = 'label-disabled';
      this.file.querySelector('input').disabled = true;
      this.file.querySelector('label').className = 'label-disabled';

      this.el.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
        checkbox.disabled = true;
      });
      this.el.querySelectorAll('.checkbox-group-div p').forEach(p => {
        p.className = 'label-disabled';
      });
      this.el.querySelectorAll('.checkbox-group-div label').forEach(label => {
        label.className = 'label-disabled';
      });
    }
  }

  this.handleLicenseChange = (e) => {
    e.stopPropagation();
    e.preventDefault();

    //Mutually exclusive checkboxes
    if (e.target.value === 'SA' && this.el.querySelector(`#SA-${this.unique}`).checked) this.el.querySelector(`#ND-${this.unique}`).checked = false;
    else if (e.target.value === 'ND' && this.el.querySelector(`#ND-${this.unique}`).checked) this.el.querySelector(`#SA-${this.unique}`).checked = false;
    else if (e.target.value === 'BY' && this.el.querySelector(`#BY-${this.unique}`).checked) {
      this.el.querySelector(`#SA-${this.unique}`).disabled = false;
      this.el.querySelector(`#NC-${this.unique}`).disabled = false;
      this.el.querySelector(`#ND-${this.unique}`).disabled = false;
    }
    else if (e.target.value === 'BY' && !this.el.querySelector(`#BY-${this.unique}`).checked) {
      this.el.querySelector(`#SA-${this.unique}`).disabled = true;
      this.el.querySelector(`#NC-${this.unique}`).disabled = true;
      this.el.querySelector(`#ND-${this.unique}`).disabled = true;
    };
  }

  this.handleDeleteFile = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.data.handleRemoveFile(this.unique);
  }

  this.handleLicenseInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();

    shell.openExternal('https://creativecommons.org/about/cclicenses/');
  }

  this.getFileData = () => {
    const file = Array.from(this.el.querySelectorAll('.file-input')).reduce((acc, input) => {
      if (!acc.license) acc.license = [];

      if (input.type === 'radio' && input.checked) return { ...acc, type: input.value };
      else if (input.type === 'radio' && !input.checked) return { ...acc };
      else if (input.type === 'file' && input.files[0]) return { ...acc, path: input.files[0].path };
      else if (input.type === 'file' && !input.files[0]) return { ...acc };
      else if (input.type === 'checkbox' && input.checked && !input.disabled) return { ...acc, license: [ ...acc.license, input.value ] }
      else if (input.type === 'checkbox' && (!input.checked || input.disabled)) return { ...acc }

      return { ...acc, [input.name]: input.value };
    }, {});

    //Handle empty fields
    if (file.type === 'original' || file.type === 'external') {
      if (file.name === '') throw new Error('File name is missing.');
      if (file.path === '') throw new Error('File is missing.');
      if (file.tags === '') throw new Error('File tags are missing.');
      if (!helpers.allowedFormat(file.name)) throw new Error('File name can only include letters, numbers and underscores.'); //Check for bad characters

      //Turn tags into an array
      file.tags = file.tags.split(/[,;]+/).filter(tag => tag.length > 0);
      if (file.tags.length === 0) throw new Error('File tags are missing');

      //Check formatting
      if (!helpers.allowedFormat(file.name)) throw new Error('File name can only include letters, numbers and underscores.'); //Check for bad characters
      for (let tag of file.tags) {
        if (!helpers.allowedFormat(tag)) throw new Error('Tags can only include letters, numbers and underscores.');
      }
    }
    else if (file.type === 'internal' && file.id === '') throw 'file id is missing';

    //Add properties
    file.cid = null;
    if (file.type !== 'internal') file.format = file.path.slice(-3);

    return file;
  }

  this.createInput = (name, type) => {
    //Create elements
    let el = document.createElement('div');
    let label = document.createElement('label');
    let input = document.createElement('input');

    //Add classes for styling
    el.className = `file-${name}-div`
    input.className = `file-input`;

    //Add attributes and innerHTML/textContent
    label.setAttribute('for', name);
    label.textContent = name + ':';
    input.setAttribute('type', type);
    input.setAttribute('name', name);

    //Build structure
    el.appendChild(label);
    el.appendChild(input);

    return el;
  }

  this.createRadio = (name) => {
    //Create elements
    let el = document.createElement('div')
    let label = document.createElement('label');
    let input = document.createElement('input');

    //Add classes for styling
    el.className = 'radio-div';
    input.className = 'file-input';

    //Add attributes and innerHTML/textContent
    label.setAttribute('for', `${name}-${this.unique}`);
    label.textContent = name;
    input.setAttribute('type', 'radio');
    input.setAttribute('id', `${name}-${this.unique}`);
    input.setAttribute('name', 'type-' + this.unique);
    input.setAttribute('value', name);

    //Add listeners
    input.onchange = this.handleTypeChange;

    //Build structure
    el.appendChild(input);
    el.appendChild(label);

    return el;
  }

  this.createCheckbox = (name) => {
    //Create elements
    let el = document.createElement('div')
    let label = document.createElement('label');
    let input = document.createElement('input');

    //Add classes for styling
    el.className = 'checkbox-div';
    input.className = 'file-input';

    //Add attributes and innerHTML/textContent
    label.setAttribute('for', `${name}-${this.unique}`);
    label.textContent = name;
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', `${name}-${this.unique}`);
    input.setAttribute('name', 'license-' + this.unique);
    input.setAttribute('value', name);
    if (name !== 'BY') input.disabled = true; //Disable all checkboxes except BY on first render

    //Add listeners
    input.onchange = this.handleLicenseChange;

    //Build structure
    el.appendChild(input);
    el.appendChild(label);

    return el;
  }

  this.render = () => {
    //Create elements
    let legend = document.createElement('legend');
    let typeDiv = document.createElement('div');
    let typeLabel = document.createElement('p');
    let typeOriginal = this.createRadio('original');
    let typeInternal = this.createRadio('internal');
    let typeExternal = this.createRadio('external');
    let name = this.createInput('name', 'text');
    let id = this.createInput('id', 'text');
    let tags = this.createInput('tags', 'text');
    let info = this.createInput('info', 'text');
    let licenseDiv = document.createElement('div');
    let licenseLabel = document.createElement('p');
    let licenseCC = document.createElement('p');
    let licenseBY = this.createCheckbox('BY');
    let licenseNC = this.createCheckbox('NC');
    let licenseSA = this.createCheckbox('SA');
    let licenseND = this.createCheckbox('ND');
    let licenseInfoButton = document.createElement('button');
    let file = this.createInput('file', 'file');
    let deleteFile = document.createElement('button');

    //Add classes for styling
    this.el.className = 'upload-file';
    typeDiv.className = 'radio-group-div';
    licenseDiv.className = 'checkbox-group-div';
    id.querySelector('label').className = 'label-disabled';
    licenseInfoButton.className = 'license-info-button'

    //Add attributes and innerHTML/textContent
    legend.textContent = 'file:'
    typeLabel.textContent = 'type:';
    typeOriginal.querySelector('.file-input').checked = true;
    licenseLabel.textContent = 'license:';
    licenseCC.textContent = 'CC';
    id.querySelector('.file-input').disabled = true;
    deleteFile.textContent = 'delete file';
    licenseInfoButton.innerHTML = infoIcon;
    licenseInfoButton.setAttribute('title', 'how do licenses work?');

    //Build structure
    typeDiv.appendChild(typeLabel);
    typeDiv.appendChild(typeOriginal);
    typeDiv.appendChild(typeInternal);
    typeDiv.appendChild(typeExternal);
    licenseDiv.appendChild(licenseLabel);
    licenseDiv.appendChild(licenseCC);
    licenseDiv.appendChild(licenseBY);
    licenseDiv.appendChild(licenseNC);
    licenseDiv.appendChild(licenseSA);
    licenseDiv.appendChild(licenseND);
    licenseDiv.appendChild(licenseInfoButton);
    this.el.appendChild(legend);
    this.el.appendChild(typeDiv);
    this.el.appendChild(name);
    this.el.appendChild(id);
    this.el.appendChild(tags);
    this.el.appendChild(info);
    this.el.appendChild(licenseDiv);
    this.el.appendChild(file);
    this.el.appendChild(deleteFile);

    //Save references elements
    this.name = name;
    this.id = id;
    this.tags = tags;
    this.info = info;
    this.file = file;

    //Add listeners
    deleteFile.onclick = this.handleDeleteFile;
    licenseInfoButton.onclick = this.handleLicenseInfo;

    return this.el;
  }
}

module.exports = UploadFile;
