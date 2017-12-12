'use strict';

// quoted from: https://www.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/
Promise.properRace = function (promises) {
  if (promises.length < 1) {
    return Promise.reject('Can\'t start a race without promises!');
  }
  var indexPromises = promises.map(function (p, index) {
    return p.catch(function () { throw index; });
  });
  return Promise.race(indexPromises).catch(function (index) {
    var p = promises.splice(index, 1)[0];
    p.catch(function (err) { return console.error(err); });
    return Promise.properRace(promises);
  });
};

function getMosaic(mosaics, ns, name) {
  return mosaics.find(function(el) {
    var mo = el.mosaicId;
    return mo.namespaceId == ns && mo.name == name;
  });
}

function getParams() {
  if(window.location.search === '') { return {}; }
  var vars = window.location.search.split('?')[1].split("&");
  var obj = {};
  vars.forEach(function(v, i) {
    var pair = v.split('=');
    obj[pair[0]] = decodeURIComponent(pair[1]);
  });
  return obj;
}

var app = document.getElementById('app');
var diag = document.getElementById('diag');
var video = document.getElementById('capture');
var address = document.getElementById('address');
var mosaics = document.getElementById('mosaics');
var closeBtn = document.getElementById('close');
var cameras = null;
var cameraIdx = 0;
var scanner = new Instascan.Scanner({video: video, mirror: false});
var params = getParams();
var filter = params['filter'] ? params['filter'].split(',') : [];

var NODES = {
  mainnet: [
    'https://nis-mainnet.44uk.net:7891',
    'https://nis-mainnet2.44uk.net:7891'
  ],
  testnet: [
    'https://nis-testnet.44uk.net:7891'
  ]
}

function requestToNode(pathAndParams, network) {
  var fetches = (NODES[network] || []).map(function(url) { return fetch(url + pathAndParams); });
  return Promise.properRace(fetches).then(function(res) { return res.json(); });
}

function props2obj(props) {
  var obj = {};
  props.forEach(function(prop) { obj[prop.name] = prop.value; });
  return obj;
}

function isAcceptedMosaic(mosaicId) {
  if (mosaicId.namespaceId === 'nem') { return false; } // reject nem:*
  if (filter.length === 0) { return true; }
  var flg = false;
  filter.forEach(function(fqn) {
    var pair = fqn.split(':');
    if(pair.length !== 2) { return false; }
    var ns = pair[0];
    var name = pair[1];
    if (ns === mosaicId.namespaceId) {
      if (name === '*' || name === mosaicId.name) {
        flg = true;
      }
    }
  });
  return flg;
}

function sortByMosaicFqn(a, b) {
  var fqnA = a.id.namespaceId + a.id.name;
  var fqnB = b.id.namespaceId + b.id.name;
  return fqnA > fqnB ? 1 : -1;
}

function showMessage(text) {
  diag.innerText = null;
  diag.innerText = text;
  diag.classList.add('active');
  setTimeout(function() {
    diag.classList.remove('active');
  }, 5000);
}

closeBtn.addEventListener('click', function(ev) {
  mosaics.innerHTML = '';
  scanner.start(cameras[cameraIdx]);
  overlay.classList.remove('active');
});

scanner.addListener('scan', function(content) {
  try {
    var addr = JSON.parse(content).data.addr;
  } catch(ex) {
    console.error(ex);
    showMessage(ex)
    return false;
  }
  var network = addr[0] === 'N' ? 'mainnet' : 'testnet';
  scanner.stop();
  requestToNode('/account/mosaic/owned?address=' + addr, network)
  .then(function(res) {
    var mosaics = res.data;
    return Promise.all(mosaics.filter(function(el) {
      return isAcceptedMosaic(el.mosaicId);
    })
    .map(function(el) {
      var mo = el.mosaicId;
      var divisibility = localStorage.getItem(mo.namespaceId + ':' + mo.name + '.divisibility');
      var description = localStorage.getItem(mo.namespaceId + ':' + mo.name + '.description');
      if(description) {
        return Promise.resolve({
          id: mo,
          description: description,
          divisibility: divisibility,
          quantity: el.quantity
        });
      } else {
        return requestToNode( '/namespace/mosaic/definition/page?namespace=' + mo.namespaceId, network)
        .then(function(res) {
          var moDefs = res.data;
          var moDef = moDefs.filter(function(def) {
            var id = def.mosaic.id;
            return id.namespaceId === mo.namespaceId && id.name === mo.name;
          })[0];
          var moId = moDef.mosaic.id;
          var obj = props2obj(moDef.mosaic.properties);
          localStorage.setItem(mo.namespaceId + ':' + mo.name + '.divisibility', obj.divisibility);
          localStorage.setItem(mo.namespaceId + ':' + mo.name + '.description', moDef.mosaic.description);
          return Promise.resolve({
            id: moId,
            description: moDef.mosaic.description,
            divisibility: obj.divisibility,
            quantity: el.quantity
          });
        });
      }
    }));
  })
  .then(function(result) {
    // DEBUG: dummy injection
    // result = result.concat([
    //   {id: {namespaceId: 'tomato', name: 'ripe'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'nembear', name: 'waribikiken'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'nembear', name: '832'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'puchikun', name: 'spthx'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'nice', name: 'art'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'namuyan', name: 'nemrin'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'namuyan', name: 'nekonium'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'kobun', name: 'kurofuku'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'hi', name: 'coin'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'lovenem', name: 'lovenem'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'nem_holder', name: 'gachiho'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'hamada', name: 'jun'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'nemket.nemket2017', name: 'entry'}, quantity: 100, divisibility: 0, description: '' },
    //   {id: {namespaceId: 'foo.bar.baz', name: 'qux'}, quantity: 10, divisibility: 0, description: 'oa:4bfbe68e4b15ef0ea48e0a8486f6e00ebf34b8efb3581af243d8b589e4dfb72e' }
    // ]);

    if(result) {
      var fg = document.createDocumentFragment();
      result = result.sort(sortByMosaicFqn);
      result.forEach(function(el) {
        var dl = document.createElement('dl');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        var mo = el.id;
        var fqn = mo.namespaceId + ':' + mo.name;
        var url = getImageURL(fqn);

        // fetch from  OpenApostille
        if(el.description.indexOf('oa:') === 0) {
          var hash = el.description.split(':')[1];
          url = 'https://s3.amazonaws.com/open-apostille-nemgallary-production/' + hash + '.jpg';
        }

        if (url) {
          var dt2 = document.createElement('dt');
          dt2.classList.add('image');
          dt2.style.backgroundImage = 'url("' + url + '")';
          dt2.style.height = 240 + 'px';
          dl.appendChild(dt2);
        }

        dt.innerText = fqn;
        dd.innerText = el.quantity / Math.pow(10, el.divisibility);
        dl.appendChild(dt);
        dl.appendChild(dd);
        fg.appendChild(dl);
      });
      mosaics.appendChild(fg);
      address.innerText = addr;
      overlay.classList.add('active');
    } else {
      alert('No mosaics found in your address');
    }
  })
  .catch(function (err) {
    console.error(err);
    // alert(err)
    showMessage(err)
    scanner.start(cameras[cameraIdx]);
  })
  ;
});

scanner.addListener('active', function() {
});
scanner.addListener('deactive', function() {
});

Instascan.Camera.getCameras()
  .then(function (cams) {
    cameras = cams;
    if (cameras.length > 0) {
      cameraIdx = cameras.length-1;
      scanner.start(cameras[cameraIdx]);
    } else {
      console.error('No cameras found.');
      alert('No cameras found.')
    }
  }).catch(function (err) {
    console.error(err);
    alert(err)
  })
;

// nemgallery definitions
var MOSAIC_ICON_BASE_URL = 'https://s3-ap-northeast-1.amazonaws.com/xembook.net/gallery/';
var MOSAIC_ICON_DEFS = {
  'tomato:ripe': 'tomato_ripe.jpg',
  'nembear:waribikiken': 'nembear_waribikiken.jpg',
  'nembear:832': 'nembear_832.jpg',
  'puchikun:spthx': 'puchikun_spthx.jpg',
  'nice:art': 'nice_art.jpg',
  'namuyan:nemrin': 'namuyan_nemrin.png',
  'namuyan:nekonium': 'namuyan_nekonium.png',
  'kobun:kurofuku': 'kobun_kurofuku.jpg',
  'hi:coin': 'hi_coin.jpg',
  'hi.happy_nem:nem': 'hi_happy_nem_nem.jpg',
  'lovenem:lovenem': 'lovenem_lovenem.jpg',
  'nem_holder:gachiho': 'nem_holder_gachiho.png',
  'hamada:jun': 'hamada_jun.png',
  'nemket.nemket2017:entry': 'nemket_nemket2017_entry.jpg'
};
var MOSAIC_ICON_BASE_URL2 = 'https://s3.amazonaws.com/open-apostille-nemgallary-production/';
var MOSAIC_ICON_DEFS2 = {
  'nemicon:nemic': 'e2a7a3ded3c31438a1c45f20392522fbe6224328a35dd3d8ecf32bdc07cf5529.jpg'
};
function getImageURL(fqn) {
  var filename = MOSAIC_ICON_DEFS[fqn]
  var filename2 = MOSAIC_ICON_DEFS2[fqn]
  return filename ? MOSAIC_ICON_BASE_URL + filename
       : filename2 ? MOSAIC_ICON_BASE_URL2 + filename2
       : null;
  // return filename ? MOSAIC_ICON_BASE_URL + filename : null;
}
