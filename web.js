// おまじない
"use strict";

// ########################################
//               初期設定など
// ########################################

// .envファイルを読み込みます
require('dotenv').config();

// パッケージを使用します
const { v4: uuidv4 } = require('uuid');
const cache = require('memory-cache');
const LinePay = require('line-pay-v3');
const express = require("express");
const app = express();


// ローカル（自分のPC）でサーバーを公開するときのポート番号です
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening... http://localhost:${process.env.PORT || 5000}`);
});

// publicフォルダのファイルを公開する
app.use(express.static(__dirname + "/public"));

// line-pay-v3を使用する準備
const pay = new LinePay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    uri: process.env.ENV === 'production' ? 'https://api-pay.line.me' : 'https://sandbox-api-pay.line.me'
});

// 決済予約処理
app.use('/pay/request', async (req, res) => {
    console.log('/pay/requestの処理を実行します。');

    // 商品名や値段を設定する場合はここを変更します。
    const order = {
        amount: 100, // packages[].amountの合計金額を記入する
        currency: 'JPY',
        orderId: uuidv4(),
        packages: [
            {
                id: 'Item001',
                amount: 100, // products[].priceの合計金額を記入する
                name: '買い物かご',
                products: [
                    {
                        name: 'チョコレート', // 商品名
                        imageUrl: 'https://2.bp.blogspot.com/-zEtBQS9hTfI/UZRBlbbtP8I/AAAAAAAASqE/vbK1D7YCNyU/s800/valentinesday_itachoco2.png', // 商品画像
                        quantity: 1, // 購入数
                        price: 100 // 商品金額
                    }
                ]
            }
        ],
        redirectUrls: {
            confirmUrl: 'http://localhost:5000/pay/confirm',
        }
    };
    console.log('以下のオプションで決済予約を行います。');
    console.log('order', order);

    try {
        // LINE Pay APIを使って、決済予約を行う。
        const response = await pay.request(order);
        console.log('response', response);

        // 決済確認処理に必要な情報を保存しておく。
        cache.put(order.orderId, order);

        // 決済画面に遷移する。
        res.redirect(response.info.paymentUrl.web);

        console.log('決済予約が完了しました。');
    } catch (e) {
        console.log('決済予約でエラーが発生しました。');
        console.log(e);
    };
});


// 決済確認処理
app.use('/pay/confirm', async (req, res) => {
    console.log('/pay/confirmの処理を実行します。');

    // 決済予約時に保存した情報を取り出す。
    const orderId = req.query.orderId;
    if (!orderId) {
        throw new Error('Order ID is not found');
    }
    const order = cache.get(req.query.orderId);
    if (!order) {
        throw new Error('Order is not found');
    }

    // 決済確認処理に必要なオプションを用意する。
    const option = {
        amount: order.amount,
        currency: order.currency
    }
    console.log('以下のオプションで決済確認を行います。');
    console.log(option);

    try {
        // LINE Pay APIを使って、決済確認を行う。
        await pay.confirm(option, req.query.transactionId)
        res.send('決済が完了しました。');

        console.log('決済が完了しました。');
    } catch (e) {
        console.log('決済確認処理でエラーが発生しました。');
        console.log(e);
    };
});
