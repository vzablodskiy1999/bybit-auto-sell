import { accounts } from './keys.js'
import { RestClientV5 } from 'bybit-api'

const { private: secret, public: apiKey } = accounts[0];

const client = new RestClientV5({
    key: apiKey,
    secret: secret
});

(() => {
    client.cancelAllOrders({
        category: 'spot'
    })
        .then(res => {
            console.log('all orders cancelled');
            console.log(res);
        })
})();