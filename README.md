# nem Mosaic Reader

QRコードのアドレスを読み込んで、そのアドレスの持つモザイクを表示します。

現状のモバイルウォレットのモザイク未対応やNEMPayの正式版がリリースされていないことの一時的な対応です。

![demo](https://user-images.githubusercontent.com/370508/33385463-09d0b180-d56c-11e7-99ee-21257cc105d8.gif)


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
