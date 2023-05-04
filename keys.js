export const accounts = [
    {
        private: '', // privateKey
        public: '', // publicKey
        isMarket: false, // true if want to sell by market
        requestTimeout: 200, // timeout between requests
        useTickerPrice: true, // true if you want to place limit order by current highest bid
        minPriceAcceptable: 0.99, // change price if useTickerPrice is true and you want to have min acceptable price
        tokenSymbol: "USDT", // token you want to sell
        pairSymbol: "USDTUSDC", // pair in Bybit
        checkWallet: true, //if you want to monitor when your tokenSymbol appears in your wallet
        qty: '1000', // if you want to sell speicific amount, if not mentioned will place an order to sell all balance,
        price: '123' // if you want to place Limit order with specific price, works only when isMarket is false 
    }
]