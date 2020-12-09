"use strict";

// Import packages.
const express = require("express");
const app = express();

// Launch server.
app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening to ${process.env.PORT || 5000}...`);
});

// Middleware configuration to serve static file.
app.use(express.static(__dirname + "/public"));

// Set ejs as template engine.
app.set("view engine", "ejs");

// Router configuration to serve web page containing pay button.
app.get("/", (req, res) => {
    res.render(__dirname + "/index");
})

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const cache = require('memory-cache');

const LinePay = require('line-pay');
const pay = new LinePay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    hostname: process.env.LINE_PAY_HOSTNAME,
    isSandbox: true
});

app.use('/pay/reserve', (req, res) => {
    console.log('/pay/reserve');
    const options = {
        productName: 'チョコレート',
        amount: 100,
        currency: 'JPY',
        orderId: uuidv4(),
        confirmUrl: process.env.LINE_PAY_CONFIRM_URL
    }
    console.log('決済予約を行います。');
    console.log(options);

    pay.reserve(options).then(response => {
        const reservation = options;
        console.log('reservation completed');
        console.log(reservation);

        reservation.transactionId = response.info.transactionId;

        cache.put(reservation.transactionId, reservation);
        res.redirect(response.info.paymentUrl.web);
    }).catch((e) => {
        console.log(e);
    });
});

app.use('/pay/confirm', (req, res) => {
    if (!req.query.transactionId) {
        throw new Error('Transaction ID is not found');
    }

    const reservation = cache.get(req.query.transactionId);
    if (!reservation) {
        throw new Error('Reservation is not found');
    }
    console.log('以下の決済予約を取得しました。');
    console.log(reservation);

    const confirmation = {
        transactionId: req.query.transactionId,
        amount: reservation.amount,
        currency: reservation.currency
    }
    console.log('以下のオプションで支払い確認を行います。');
    console.log(confirmation);

    pay.confirm(confirmation).then(() => {
        res.send('決済が完了しました。');
    }).catch((e) => {
        console.log(e);
    });;
});