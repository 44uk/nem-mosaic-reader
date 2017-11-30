# nem Mosaic Reader

QRコードのアドレスを読み込んで、そのアドレスの持つモザイクを表示します。

現状のモバイルウォレットのモザイク未対応やNEMPayの正式版がリリースされていないことの一時的な対応を目的としています。

![demo gif](https://user-images.githubusercontent.com/370508/33385463-09d0b180-d56c-11e7-99ee-21257cc105d8.gif)

* デモンストレーションのため可分数などが実際の表示とは異なります。


## 動作デモ

https://44uk.github.io/nem-mosaic-reader

ネットワークはアドレスから判断するのでテストネット・メインネットどちらでも利用できます。


## フィルター機能

```
# foo:barとbaz:quxモザイクのみ表示する
?filter=foo:bar,baz:qux

# fooネームスペースのモザイクのみ表示する
?filter=foo:*
```

例)

https://44uk.github.io/nem-mosaic-reader?filter=ecobit:eco,dim:coin

パラメタとしてカンマ区切りでモザイクのフルネームを渡すと、そのモザイクだけを表示します。
`ネームスペース:*`でネームスペース以下のモザイクだけを表示します。

* フィルターで指定しても`nem:xem`は表示されません。


## NEMGallery / OpenApostille対応

[NEMGallery](http://xembook.net/nemgallery.html)への登録がある場合、画像が表示されます。

[OpenApostille](https://www.openapostille.net/)にてNEMGallary Descriptionの登録がある場合、画像が表示されます。


## 制約

`https`プロトコルを用いるため、`https`対応のNISサーバを自前で立てています。

* https://nis-testnet.44uk.net:7891/status
* https://nis-mainnet.44uk.net:7891/status

nemネットワークのノードにおいて、現状`https`プロトコルを提供するメリットがないため、
ほとんどのノードは`https`の対応をおこなっていないと思われます。

公開ソースでは、このサーバだけに頼っているため、接続ができない場合があります。
もしQR読み込み後のモザイク問い合わせ時にエラーが起きた場合は、時間を少し開けて数回試してみてください。

それでもエラーが起き続ける場合は、[@44uk_i3](https://twitter.com/44uk_i3)にご連絡ください。


## カスタマイズ

自由にカスタマイズしていただいて結構ですが、ソースにハードコーディングされている、上記の私が立てているサーバでの動作保証は致しかねます。
サーバは予告なく停止する可能性があります。

`https`プロトコルを受け付けるノードを探すか、ご自身でご用意することを推奨します。

* [httpsプロトコルに応答するNISサーバの構築 | yukku++](http://blog.44uk.net/2017/10/31/nis-with-https-by-dehydrated/)

イベントなどで一時的に利用したいので安定する動作を期待したい、などの相談があれば承りますので[@44uk_i3](https://twitter.com/44uk_i3)へご連絡ください。

