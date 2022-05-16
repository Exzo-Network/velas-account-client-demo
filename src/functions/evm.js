import Web3 from 'web3';
import BN from 'bn.js';

import { vaclient } from './vaclient';

function EVM(form) {
    this.form     = form;
    this.web3     = new Web3(vaclient.provider);
    this.gas      = 50000;
    this.gasPrice = 2000000001;
    this.decimal  = 1000000000000000000;

    this.maxFee    = Math.ceil((this.gas * this.gasPrice) / this.decimal*100000)/100000;
    this.donateVLX = 1;

    this.countractAddress = '0x9b2e0Bb20D4B3e2456B509029662EDbDFba2a09a';
    this.donateAddress    = '0xACF8ef3c3f5536513429629428F8324a5D634b39';

    this.storage = new this.web3.eth.Contract([{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"num","type":"uint256"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"StoreNumber","type":"event"},{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}], this.countractAddress);
};

EVM.prototype.getBalance = async function() {
    var balance = await this.web3.eth.getBalance(this.form);
        balance = this.web3.utils.fromWei(balance, 'ether');
        balance = Math.floor(balance*100000)/100000;

        this.balance = balance;

        return balance;
};

EVM.prototype.events = async function(cb) {
    try {
        const response = await fetch(`${process.env.REACT_APP_SPONSOR_HOST}/history`);
        const result   = await response.json();
        const items = result.history ? result.history.reverse().map(item => {
            if (item.to === this.donateAddress.toLowerCase()) {
                let amount = this.web3.utils.fromWei(item.value, 'ether');
                    amount = Math.floor(amount*100000)/100000;

                return {
                    type: 1,
                    from: item.from.toLowerCase(),
                    value: `VLX ${amount}`,
                    hash: item.hash,
                };
            };

            if (item.to === this.countractAddress.toLowerCase()) {
                return {
                    type: 2,
                    from: item.from.toLowerCase(),
                    value: `Hi there!`,
                    hash: item.hash,
                };

            };

            return {
                type: 2,
                from: '0x0',
                value: `Hi there!`,
                hash: '0x0',
            };
        }) : [];

        cb(items)
    } catch (error) {
        cb([]);
    };
};

EVM.prototype.transfer = async function(cb) {
    if (this.balance < (this.donateVLX + this.maxFee)) {
        cb(`No enough VLX for this transaction ${ this.donateVLX + this.maxFee } VLX`, null);
        return;
    };

    let csrf_token = null;

    try {
        const response = await fetch(`${process.env.REACT_APP_SPONSOR_HOST}/csrf`);
        const { token } = await response.json();
        csrf_token = token;
    } catch (error) {
        cb("csrf host is not available", null);
        return;
    };

    const nonce = await this.web3.eth.getTransactionCount(this.form);

    var a = new BN(this.donateVLX);
    var b = new BN(this.decimal.toString());
    const amountBN = a.mul(b)

    const raw = {
        nonce,
        from:     this.form,
        to:       this.donateAddress,
        value:    this.web3.utils.toHex(amountBN.toString()),
        gas:      this.web3.utils.toHex(this.gas),
        gasPrice: this.web3.utils.toHex(this.gasPrice),
        broadcast: true,
        csrf_token,
    };

    this.web3.eth.sendTransaction(raw).then(cb).catch(cb);
};

EVM.prototype.contract = async function(cb) {
    if (this.balance < this.maxFee) {
        cb(`No enough VLX for this transaction (${ this.maxFee } VLX).`, null);
        return;
    };

    let csrf_token = null;

    try {
        const response = await fetch(`${process.env.REACT_APP_SPONSOR_HOST}/csrf`);
        const { token } = await response.json();
        csrf_token = token;
    } catch (error) {
        throw new Error("csrf host is not available");
    };

    this.nonce = await this.web3.eth.getTransactionCount(this.form);

    const raw = {
        nonce:    this.nonce,
        from:     this.form,
        gas:      this.web3.utils.toHex(this.gas),
        gasPrice: this.web3.utils.toHex(this.gasPrice),
        broadcast: true,
        csrf_token,
    }

    this.storage.methods.store("123").send(raw)
    .on('error', function(error){ 
        cb(error.message, null)
    })
    .on('receipt', function(receipt){
       cb(null, receipt.transactionHash)
    })
};

export default EVM;
