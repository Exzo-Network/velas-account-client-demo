import Web3 from 'web3';
import BN from 'bn.js'

import { vaclient } from './vaclient';

function EVM(options) {
    this.web3 = new Web3(vaclient.provider);
    this.gas = 50000;
    this.gasPrice = 2000000001;
    this.decimal = 1000000000000000000;

    this.maxFee = Math.ceil((this.gas * this.gasPrice) / this.decimal*100000)/100000;
    this.donateVLX = 0.097;

    this.countractAddress = '0x9b2e0Bb20D4B3e2456B509029662EDbDFba2a09a';
    this.donateAddress    = '0xACF8ef3c3f5536513429629428F8324a5D634b39';

    this.storage = new this.web3.eth.Contract([{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"num","type":"uint256"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"StoreNumber","type":"event"},{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}], this.countractAddress);
};

EVM.prototype.getBalance = async function(address) {
    var balance = await this.web3.eth.getBalance(address);
        balance = this.web3.utils.fromWei(balance, 'ether');
        return Math.floor(balance*100000)/100000;
};

EVM.prototype.events = async function(cb) {
    let foundTransactions = [];
    
    let startBlock   = await this.web3.eth.getBlockNumber();
    let currentBlock = startBlock;

    for (let i = 0; currentBlock > (startBlock - 300) && foundTransactions.length < 10; i++) {
        const block = await this.web3.eth.getBlock(currentBlock, true);

        if (block.transactions.length) {
            for (var transaction of block.transactions) {

                if (transaction.to === this.donateAddress) {
                    let amount = this.web3.utils.fromWei(transaction.value, 'ether');
                        amount = Math.floor(amount*100000)/100000;

                    foundTransactions.push({
                        type: 1,
                        from: transaction.from.toLowerCase(),
                        value: `VLX ${amount}`,
                        hash: transaction.hash,
                    });
                };

                if (transaction.to === this.countractAddress) {
                    foundTransactions.push({
                        type: 2,
                        from: transaction.from.toLowerCase(),
                        value: `Hi there!`,
                        hash: transaction.hash,
                    });

                };
            };
        };
        
        currentBlock = currentBlock - 1;
    };

    cb(foundTransactions);
};

EVM.prototype.transfer = async function(from, cb) {
    var balance = await this.getBalance(from);

    if (balance < (this.donateVLX + this.maxFee)) {
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

    const nonce = await this.web3.eth.getTransactionCount(from);

    const amount = this.donateVLX * this.decimal

    this.web3.eth.sendTransaction({
        nonce,
        from,
        to:       this.donateAddress,
        value:    this.web3.utils.toHex(amount),
        gas:      this.web3.utils.toHex(this.gas),
        gasPrice: this.web3.utils.toHex(this.gasPrice),
        broadcast: true,
        csrf_token,
    }).then(cb).catch(cb);
};

EVM.prototype.contract = async function(from, cb) {
    var balance = await this.getBalance(from);

    if (balance < this.maxFee) {
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

    const nonce = await this.web3.eth.getTransactionCount(from)

    this.storage.methods.store("123").send({
        nonce,
        from,
        gas:      this.web3.utils.toHex(this.gas),
        gasPrice: this.web3.utils.toHex(this.gasPrice),
        broadcast: true,
        csrf_token,
    })
    .on('error', function(error){ 
        console.log(error)
        cb(error.message, null)
    })
    .on('receipt', function(receipt){
       cb(null, receipt.transactionHash)
       console.log("receipt", receipt)
    })
};

export default new EVM();
