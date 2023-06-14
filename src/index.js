/* eslint-disable max-classes-per-file */
const pako = require('pako');

function hexToBytes(hexString) {
  const bytes = [];

  for (let i = 0; i < hexString.length; i += 2) {
    const hex = hexString.substr(i, 2);
    const byte = parseInt(hex, 16);
    bytes.push(byte);
  }

  return bytes;
}

function crc32Hex(hexString) {
  const table = generateCRCTable();
  let crc = 0xFFFFFFFF;

  const data = hexToBytes(hexString);

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function generateCRCTable() {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let crc = i;

    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc >>>= 1;
      }
    }

    table[i] = crc;
  }

  return table;
}

function bytesToHex(bytes) {
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// console.log(crc32Hex('49454e44').toString(16));

function compressData(hexData) {
  const byteArray = new Uint8Array(hexData.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
  const compressedData = pako.deflate(byteArray, { level: -1 });
  const compressedHexData = Array.from(compressedData).map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return compressedHexData;
}

function giveMeResult(data) {
  const splitedData = data.split('');

  for (let i = 0; i < splitedData.length; i++) {
    if (splitedData[i] === ' ') {
      splitedData.splice(i, 1);
    }
  }

  return splitedData.join('');
}

const getByteSize = (hexString) => hexString.length / 2;

const pictureWidthInput = document.getElementById('pictureWidth');
const pictureHeightInput = document.getElementById('pictureHeight');
const colorDepthInput = document.getElementById('colorDepth');
const colorPaletteTypeInput = document.getElementById('colorPaletteType');
const interlacingUssageInput = document.getElementById('interlacingUssage');

const pictureLayoutInput = document.getElementById('pictureLayoutInput');

const closeButton = document.querySelector('.close-button');
const popup = document.querySelector('.popup');

function createPng() {
  let result = '';

  const signature = '89504e470d0a1a0a';
  result += signature;

  class IHDR {
    constructor(width, height, colorDepth, colorPaletteType, interlacingUssage) {
      this.dataSize = '0000000d';
      this.name = '49484452';
      this.width = Number(width).toString(16).padStart(8, '0');
      this.height = Number(height).toString(16).padStart(8, '0');
      this.colorDepth = Number(colorDepth).toString(16).padStart(2, '0');
      this.colorPaletteType = Number(colorPaletteType).toString(16).padStart(2, '0');
      this.deflate = '00';
      this.filterMethod = '00';
      this.interlacingUssage = Number(interlacingUssage).toString(16).padStart(2, '0');
      this.controlSum = crc32Hex(`49484452${Number(width).toString(16).padStart(8, '0')}${Number(height).toString(16).padStart(8, '0')}${Number(colorDepth).toString(16).padStart(2, '0')}${Number(colorPaletteType).toString(16).padStart(2, '0')}0000${Number(interlacingUssage).toString(16).padStart(2, '0')}`).toString(16).padStart(8, '0');
    }
  }

  const IHDRresult = new IHDR(
    pictureWidthInput.value,
    pictureHeightInput.value,
    colorDepthInput.value,
    colorPaletteTypeInput.value,
    interlacingUssageInput.value,
  );

  for (let i in IHDRresult) {
    result += IHDRresult[`${i}`];
  }

  class PLTE {
    constructor() {
      this.dataSize = getByteSize('ffffff000000ffd541').toString(16).padStart(8, '0');
      this.name = '504c5445';
      this.data = 'ffffff000000ffd541';
      this.controlSum = crc32Hex('504c5445ffffff000000ffd541').toString(16).padStart(8, '0');
    }
  }

  if (IHDRresult.colorPaletteType === '03') {
    const PLTEresult = new PLTE();

    for (let i in PLTEresult) {
      result += PLTEresult[`${i}`];
    }
  }

  class IDAT {
    constructor(colors) {
      this.dataSize = getByteSize(compressData(colors)).toString(16).padStart(8, '0');
      this.name = '49444154';
      this.colorsLayout = compressData(giveMeResult(colors));
      this.controlSum = crc32Hex(`49444154${compressData(colors)}`).toString(16).padStart(8, '0');
    }
  }

  const IDATresult = new IDAT(pictureLayoutInput.value);

  for (let i in IDATresult) {
    result += IDATresult[`${i}`];
  }

  class IEND {
    constructor() {
      this.dataSize = '00000000';
      this.name = '49454e44';
      this.controlSum = crc32Hex('49454e44').toString(16).padStart(8, '0');
    }
  }

  const IENDresult = new IEND();

  for (let i in IENDresult) {
    result += IENDresult[`${i}`];
  }

  console.log(result);

  window.navigator.clipboard.writeText(result);
  popup.style.display = 'flex';

  return result;
}

const createPngButton = document.getElementById('createPngButton');

createPngButton.onclick = createPng;

closeButton.onclick = () => {
  popup.style.display = 'none';
};
