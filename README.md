# LINE Pay Sample

## インストール

```bash
npm i
```

## 環境変数

`.env.sample`をコピーして`.env`を作成し、以下の内容を入力する。

| 項目 | 内容 | 備考 |
| -- | -- | -- |
| LINE_PAY_CHANNEL_ID | LINE PayのチャネルID | LINE Pay管理画面から取得可能 |
| LINE_PAY_CHANNEL_SECRET | LINE Payのチャネルシークレット | LINE Pay管理画面から取得可能 |
| LINE_PAY_CONFIRM_URL | http://localhost:3000/pay/confirm | herokuなどにデプロイする場合は変更する |
| LINE_PAY_HOSTNAME | (不要) | プロキシを使用する場合は入力する |

## 実行

```bash
node web.js

server is listening to 3000...
```

サーバー起動後、http://localhost:3000/ からアクセスできる。