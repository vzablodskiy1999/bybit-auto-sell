import { accounts } from './keys.js'
import { RestClientV5, WebsocketClient } from 'bybit-api'

const WALLET_V5 = 'wallet';
const MIN_SECONDS = 1;
const MAX_SECONDS = 45;

const sleep = async (millis) => new Promise(resolve => setTimeout(resolve, millis));

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

accounts.forEach(async ({ private: secret, public: apiKey, isMarket, requestTimeout, qty, price, useTickerPrice, minPriceAcceptable, tokenSymbol, pairSymbol, checkWallet }) => {
    const client = new RestClientV5({
        key: apiKey,
        secret: secret
    });
    let wsClient;
    let orderPlaced;
    let interval;

    const tryToCreateOrder = ({
        isMarket = true,
        requestTimeout = 150,
        useTickerPrice = false,
        qty,
        price,
        minPriceAcceptable,
    }) => {
        let bestPrice = price;

        const submitOrder = () => {
            interval = setInterval(() => {
                client.submitOrder({
                    'category': 'spot',
                    'qty': String(qty),
                    'orderType': isMarket ? 'Market' : 'Limit',
                    'side': 'Sell',
                    'symbol': pairSymbol,
                    ...(!isMarket && {
                        'price': String(bestPrice),
                    })
                })
                    .then((res) => {
                        if (res.retCode === 0) {
                            orderPlaced = true;
                            wsClient?.unsubscribeV5(WALLET_V5, 'spot');
                            console.log('Order placed');
                            clearInterval(interval);
                            interval = null;
                        } else {
                            console.log('Order place failed');
                            console.log(res);
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            }, requestTimeout);
        }

        if (useTickerPrice) {
            client.getTickers({
                'category': 'spot',
                'symbol': pairSymbol
            }).then(() => {{
                bestPrice = res.result.list?.[0]?.bid1Price;
                
                if (res.retCode === 0 && Number(bestPrice) > minPriceAcceptable) {
                    submitOrder();
                }
            }});
        } else {
            submitOrder();
        }
    };

    if (checkWallet) {
        wsClient = new WebsocketClient(
            {
            key: apiKey,
            secret: secret,
            market: 'v5',
            }
        );
        wsClient.subscribeV5(WALLET_V5, 'spot');

        wsClient.on('update', (data) => {
            if (data.topic === WALLET_V5) {
                const tokenTransfer = data.data.find(a => a.coin.some(c => c.coin === tokenSymbol))
                    .coin.find(c => c.coin === tokenSymbol);

                if (tokenTransfer?.walletBalance && !orderPlaced) {
                    const balance = tokenTransfer.walletBalance;
                    
                    tryToCreateOrder({
                        isMarket,
                        qty: qty ? qty : balance,
                        price,
                        requestTimeout,
                        useTickerPrice,
                        minPriceAcceptable,
                    });
                }
            }   
        });

        wsClient.on('open', ({ wsKey }) => {
            console.log('connection open for websocket with ID: ' + wsKey);
        });

        wsClient.on('reconnect', ({ wsKey }) => {
            console.log('ws automatically reconnecting.... ', wsKey);
        });

        wsClient.on('reconnected', (data) => {
            console.log('ws has reconnected ', data?.wsKey);
        });
    } else {
        client.getWalletBalance({
            accountType: 'spot'
        }).then(res =>{
            const balance = res.result.list[0].coin.find(c => c.coin === 'USDT').walletBalance;
    
            tryToCreateOrder({
                isMarket,
                qty: qty ? qty : balance,
                price,
                requestTimeout,
                useTickerPrice,
                minPriceAcceptable,
            });
        });
    }

    await sleep(randomIntFromInterval(MIN_SECONDS, MAX_SECONDS) * 1000);
})
