function getMosaic(mosaics, ns, name) {
  return mosaics.find(function(el) {
    var mo = el.mosaicId;
    return mo.namespaceId == ns && mo.name == name;
  });
}

var app = document.getElementById('app');
var video = document.getElementById('capture');
var closeBtn = document.getElementById('close');
var cameras = null;
var cameraIdx = 0;
var address = document.getElementById('address');
var mosaics = document.getElementById('mosaics');
var scanner = new Instascan.Scanner({
  video: video,
  mirror: false
});

// var switchBtn = document.getElementById('switch');
// switchBtn.addEventListener('click', function(ev) {
//   if(cameraIdx == cameras.length-1) {
//     cameraIdx = 0;
//   } else {
//     cameraIdx += 1;
//   }
//   scanner.stop();
//   scanner.start(cameras[cameraIdx]);
// });

closeBtn.addEventListener('click', function(ev) {
  mosaics.innerHTML = '';
  scanner.start(cameras[cameraIdx]);
  overlay.classList.remove('active');
});

scanner.addListener('active', function() {
});
scanner.addListener('deactive', function() {
});

function props2obj(props) {
  var obj = {};
  props.forEach(function(prop) { obj[prop.name] = prop.value; });
  return obj;
}

scanner.addListener('scan', function(content) {
  var addr = JSON.parse(content).data.addr;
  var network = addr[0] === 'N' ? 'mainnet' : 'testnet';
  scanner.stop();
  fetch('https://nis-' + network + '.44uk.net:7891/account/mosaic/owned?address=' + addr)
  .then(function(res) { return res.json(); })
  .then(function(res) {
    var mosaics = res.data;
    return Promise.all(mosaics
    .filter(function(el) { return el.mosaicId.namespaceId !== 'nem'; })
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
        return fetch('https://nis-' + network + '.44uk.net:7891/namespace/mosaic/definition/page?namespace=' + mo.namespaceId)
        .then(function(res) { return res.json(); })
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
    var dl = document.createElement('dl');
    if(result) {
      result.forEach(function(el) {
        var mo = el.id;
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        dt.innerText = mo.namespaceId + ':' + mo.name;
        dd.innerText = el.quantity / Math.pow(10, el.divisibility);
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      mosaics.appendChild(dl);
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
