# nem Mosaic Reader

QRコードのアドレスを読み込んで、そのアドレスの持つモザイクを表示します。

現状のモバイルウォレットのモザイク未対応やNEMPayの正式版がリリースされていないことの一時的な対応です。

![demo](https://user-images.githubusercontent.com/370508/33385463-09d0b180-d56c-11e7-99ee-21257cc105d8.gif)

※デモンストレーションのため可分数などが実際の表示とは異なります。


## フィルター機能

```
?filter=foo:bar,baz:qux
```

例)

https://44uk.github.io/nem-mosaic-reader?filter=ecobit:eco,dim:coin

パラメタとしてカンマ区切りでモザイクのフルネームを渡すと、そのモザイクだけを表示します。

※フィルターで指定してもnem:xemは必ず表示されません。


## NEMGallery対応

[NEMGallery](http://xembook.net/nemgallery.html) への登録がある場合、画像が表示されます。


## 制約

`https`プロトコルを用いるため、`https`対応のNISサーバを自前で立てています。

* https://nis-testnet.44uk.net:7891/status
* https://nis-mainnet.44uk.net:7891/status

現状このサーバだけに頼っているため、接続ができない場合があります。
もしQR読み込み後のモザイク問い合わせ時にエラーが起きた場合は、時間を少し開けて数回試してみてください。

それでもエラーが起き続ける場合は、[@44uk_i3](https://twitter.com/44uk_i3)にご連絡ください。
