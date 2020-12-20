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
const LinePay = require('line-pay');
const express = require("express");
const app = express();


// ローカル（自分のPC）でサーバーを公開するときのポート番号です
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening... http://localhost:${process.env.PORT || 5000}`);
});

// publicフォルダのファイルを公開する
app.use(express.static(__dirname + "/public"));

const pay = new LinePay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    hostname: process.env.LINE_PAY_HOSTNAME,
    isSandbox: true // サンドボックスの場合、trueにする
});

// 決済予約処理
app.use('/pay/reserve', async (req, res) => {
    console.log('/pay/reserveの処理を実行します。');

    // 商品名や値段を設定する場合はここを変更します。
    const options = {
        productName: 'チョコレート',
        amount: 100,
        currency: 'JPY',
        orderId: uuidv4(),
        confirmUrl: process.env.LINE_PAY_CONFIRM_URL
    }
    console.log('以下のオプションで決済予約を行います。');
    console.log(options);

    try {
        // LINE Pay APIを使って、決済予約を行う。
        const response = await pay.reserve(options);
        
        // 決済確認処理に必要な情報を用意し、後で使うので保存しておく。
        const reservation = options;
        reservation.transactionId = response.info.transactionId;
        console.log(reservation);
        cache.put(reservation.transactionId, reservation);

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
    if (!req.query.transactionId) {
        throw new Error('Transaction ID is not found');
    }

    // 決済予約時に保存した情報を取り出す。
    const reservation = cache.get(req.query.transactionId);
    if (!reservation) {
        throw new Error('Reservation is not found');
    }
    console.log('以下の決済予約を取得しました。');
    console.log(reservation);

    // 決済確認処理に必要なオプションを用意する。
    const confirmation = {
        transactionId: req.query.transactionId,
        amount: reservation.amount,
        currency: reservation.currency
    }
    console.log('以下のオプションで決済確認を行います。');
    console.log(confirmation);

    try {
        // LINE Pay APIを使って、決済確認を行う。
        await pay.confirm(confirmation)
        res.send('決済が完了しました。');

        console.log('決済が完了しました。');
    } catch (e) {
        console.log('決済確認処理でエラーが発生しました。');
        console.log(e);
    };
});
