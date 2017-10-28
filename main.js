// ページはhttpsで配信、ghpageでできる
// ノードは自前で用意しないといけない

// fetch active nodes on start

function modal() {
}

function getMosaic(mosaics, ns, name) {
  return mosaics.find(function(el) {
    var mo = el.mosaicId;
    return mo.namespaceId == ns && mo.name == name;
  });
}

var m = document.getElementById('mount');
var v = document.createElement('video');
v.autoplay = true;
v.width = 240;
v.id = 'scanner';

var cam = null;
var scanner = new Instascan.Scanner({
  video: v,
  mirror: false
});

var mosaics = document.getElementById('mosaics');

scanner.addListener('active', function() {
});
scanner.addListener('deactive', function() {
});

scanner.addListener('scan', function(content) {
  var addr = JSON.parse(content).data.addr;
  // var addr = 'TDWWYDGQNBKSAJBSHZX7QWVX7WNVAWWB7HGPWRB2';
  scanner.stop();
  fetch('https://nis-testnet.44uk.net:7891/account/mosaic/owned?address=' + addr)
    .then(function(res) { return res.json(); })
    .then(function(res) {
      var ul = document.createElement('ul');

      if(! res.data) {
        alert('No mosaic found in your address');
      } else {
        res.data.forEach(function(el) {
          var mo = el.mosaicId;
          var li = document.createElement('li');
          li.innerText = mo.namespaceId + ':' + mo.name + ' - ' + el.quantity;
          ul.appendChild(li);
        });
        mosaics.appendChild(ul);
      }
      // var mo = getMosaic(res.data, 'nem', 'xem');
    })
    .then(function(res) {
      setTimeout(function() {
        mosaics.innerHTML = '';
        scanner.start(cam);
      }, 10000)
    })
    .catch(function (err) {
      console.error(err);
      alert(err)
    })
  ;
});

Instascan.Camera.getCameras()
  .then(function (cams) {
    if (cams.length > 0) {
      cam = cams[cams.length-1];
      console.log(cam.name);
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

mount.appendChild(v);
