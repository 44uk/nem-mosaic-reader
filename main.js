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
    obj[pair[0]] = pair[1];
  });
  return obj;
}

var app = document.getElementById('app');
var video = document.getElementById('capture');
var address = document.getElementById('address');
var mosaics = document.getElementById('mosaics');
var closeBtn = document.getElementById('close');
var cameras = null;
var cameraIdx = 0;
var scanner = new Instascan.Scanner({video: video, mirror: false});
var params = getParams();
var filter = params['filter'] ? params['filter'].split(',') : [];

scanner.addListener('active', function() {
});
scanner.addListener('deactive', function() {
});

function requestToNode(pathAndParams, network) {
  var url = 'https://nis-'  + network + '.44uk.net:7891' + pathAndParams;
  return fetch(url).then(function(res) { return res.json(); });
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

closeBtn.addEventListener('click', function(ev) {
  mosaics.innerHTML = '';
  scanner.start(cameras[cameraIdx]);
  overlay.classList.remove('active');
});

scanner.addListener('scan', function(content) {
  var addr = JSON.parse(content).data.addr;
  var network = addr[0] === 'N' ? 'mainnet' : 'testnet';
  scanner.stop();
  requestToNode('/account/mosaic/owned?address=' + addr, network)
  .then(function(res) {
    var mosaics = res.data;
    return Promise.all(mosaics
    .filter(function(el) {
      return isAcceptedMosaic(el.mosaicId);
    })
    .map(function(el) {
      var mo = el.mosaicId;
      var divisibility = localStorage.getItem(mo.namespaceId + ':' + mo.name + '.divisibility');
      if(divisibility) {
        return Promise.resolve({
          id: mo,
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
          var obj = props2obj(moDef.mosaic.properties);
          localStorage.setItem(mo.namespaceId + ':' + mo.name + '.divisibility', obj.divisibility);
          return Promise.resolve({
            id: moDef.mosaic.id,
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
    //   {id: {namespaceId: 'tomato', name: 'ripe'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'nembear', name: 'waribikiken'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'nembear', name: '832'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'puchikun', name: 'spthx'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'nice', name: 'art'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'namuyan', name: 'nemrin'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'namuyan', name: 'nekonium'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'kobun', name: 'kurofuku'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'hi', name: 'coin'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'lovenem', name: 'lovenem'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'nem_holder', name: 'gachiho'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'hamada', name: 'jun'}, quantity: 100, divisibility: 0 },
    //   {id: {namespaceId: 'nemket.nemket2017', name: 'entry'}, quantity: 100, divisibility: 0 }
    // ]);

    if(result) {
      var fg = document.createDocumentFragment();
      result.forEach(function(el) {
        var dl = document.createElement('dl');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        var mo = el.id;
        var fqn = mo.namespaceId + ':' + mo.name;
        var url = getImageURL(fqn);
        if(url) {
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
    alert(err)
    scanner.start(cameras[cameraIdx]);
  })
  ;
});

Instascan.Camera.getCameras()
  .then(function (cams) {
    cameras = cams;
    if (cameras.length > 0) {
      cameraIdx = cameras.length-1;
      cam = cameras[cameraIdx];
      scanner.start(cam);
    } else {
      console.error('No cameras found.');
      alert('No cameras found.')
    }
  }).catch(function (err) {
    console.error(err);
    alert(err)
  })
;

// preparing
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
function getImageURL(fqn) {
  var filename = MOSAIC_ICON_DEFS[fqn]
  return filename ? MOSAIC_ICON_BASE_URL + filename : null;
}
