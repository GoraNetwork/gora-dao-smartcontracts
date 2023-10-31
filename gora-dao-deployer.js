const fetch = require('node-fetch');
const sha512_256 = require('js-sha512').sha512_256;

const GoraDaoDeployer = class {
    constructor(props) {
        // Configurations instance
        this.config = props.config
        // Logger instance with Winston-Chalk logger module
        this.logger = props.logger
        // AlgoSDK instance
        this.algosdk = props.algosdk

        // Menmonic for proposer account
        this.mnemonic0 = props.mnemonic0

        // Menmonic for participant 1 account
        this.mnemonic1 = props.mnemonic1
        // Menmonic for participant 2 account
        this.mnemonic2 = props.mnemonic2
        // Menmonic for participant 3 account
        this.mnemonic3 = props.mnemonic3

        // Remote or local mode for deployer , defaults to remote
        this.mode = props.config.deployer.mode

        // Algod API Server MAINNET & TESTNET
        this.algodServer = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.algod_testnet_remote_server : props.config.gora_dao.algod_remote_server
        this.algodTestServer = props.config.gora_dao.algod_testnet_remote_server

        // Algod API Token
        this.algodToken = props.config.gora_dao.algod_remote_token
        // Algod API Port
        this.algodPort = props.config.gora_dao.algod_remote_port
        // Algod API Client
        this.algodClient = new props.algosdk.Algodv2(this.algodToken, this.algodServer, this.algodPort)

        // Indexer API Server MAINNET & TESTNET
        this.indexerServer = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.indexer_testnet_remote_server : props.config.gora_dao.indexer_remote_server
        // Indexer API Token
        this.indexerToken = props.config.gora_dao.indexer_remote_token
        // Algod API Port
        this.indexerPort = props.config.gora_dao.indexer_remote_port
        // Indexer API Client
        this.indexerClient = new props.algosdk.Indexer(this.algodToken, this.indexerServer, this.indexerPort)


        // GoraDAO Main Contract
        this.applicationId = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_main_id : props.config.gora_dao.asc_main_id
        // GoraDAO Main Contract Address
        this.applicationAddr = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_main_address : props.config.gora_dao.asc_main_address
        

        this.proposalApplicationId = props.config.gora_dao.asc_proposal_id
        this.proposalApplicationAddress = props.config.gora_dao.asc_proposal_address
        this.proposalAsset= props.config.gora_dao.proposal_asa_id

        this.contract = props.contract
        this.approvalProgData = props.approvalProgData
        this.clearProgData = props.clearProgData
        this.approvalPyTealProgData = props.approvalPyTealProgData

        this.proposalItem = props.proposalItem


        // Global Variables attached to class instance object
        this.accountObject = null
        this.accountBalance = null
        this.assetsHeld = null
        this.assetsCreated = null
        this.appsCreated = null
        this.assetsHeldBalance = null
        this.assetsCreatedBalance = null
        this.trxPayment = null
        this.trxTransfer = null

    }
    importAccount() {
        const acc = this.algosdk.mnemonicToSecretKey(this.mnemonic);
        let addr = acc.addr
        const accRekey = null;
        this.logger.info("Account Address = %s", addr);
        let acc_decoded = this.algosdk.decodeAddress(addr);
        this.logger.info("Account Address Decoded Public Key = %s", acc_decoded.publicKey.toString());
        this.logger.info("Account Address Decoded Checksum = %s", acc_decoded.checksum.toString());
        let acc_encoded = this.algosdk.encodeAddress(acc_decoded.publicKey);
        this.logger.info("Account Address Encoded = %s", acc_encoded);
        this.logger.warn(this.config.gora_dao['algo_dispenser'] + addr);
        return { acc, accRekey };
    };
    getMethodByName(name, contract) {
        const m = contract.methods.find((mt) => { return mt.name == name })
        if (m === undefined)
            throw Error("Method undefined: " + name)
        return m
    }

    async fetchAlgoWalletInfo() {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {
            const url = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/accounts/${this.accountObject.addr}`;
            const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['indexer_testnet_remote_server'] : this.config.gora_dao['indexer_remote_server']}/v2/accounts/${this.accountObject.addr}/transactions?limit=10`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let data = await res.json()
            if (data) {
                if (data.account) {
                    if (String(data.account.address) === String(this.accountObject.addr)) {
                        this.accountBalance = data.account.amount
                        this.assetsHeld = data.account.assets
                        this.assetsCreated = data.account["created-assets"]
                        this.appsCreated = data.account["created-apps"]
                        this.assetsHeldBalance = !!this.assetsHeld ? this.assetsHeld.length : 0
                        this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0
                        if (this.appsCreated) this.appsCreatedBalance = this.appsCreated.length

                        this.logger.info('------------------------------')
                        this.logger.info("Account Balance = %s", this.accountBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Assets = %s", JSON.stringify(this.assetsCreated, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Assets Balance= %s", this.assetsHeldBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Held Assets = %s", JSON.stringify(this.assetsHeld, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Held Assets Balance= %s", + this.assetsHeldBalance);
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Apps = %s", JSON.stringify(this.appsCreated, null, 2));
                        this.logger.info('------------------------------')
                        this.logger.info("Account Created Apps Balance = %s", this.appsCreatedBalance);
                        this.logger.info('------------------------------')
                    }
                }

            }
            let resTrx = await fetch(urlTrx, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let dataTrx = await resTrx.json()
            if (dataTrx) {
                if (dataTrx.transactions) {
                    this.trxPayment = dataTrx.transactions.filter(
                        (trx) => !!trx["payment-transaction"]
                    )
                    this.trxTransfer = dataTrx.transactions.filter(
                        (trx) => !!trx["asset-transfer-transaction"]
                    )
                    this.logger.info('trxPayment: %s', this.trxPayment.length)
                    this.logger.info('trxTransfer: %s', this.trxTransfer.length)

                }
            }


        }
    }
    async printTransactionLogs(txID) {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {
            const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['indexer_testnet_remote_server'] : this.config.gora_dao['indexer_remote_server']}/v2/transactions/${txID}`;

            let resTrx = await fetch(urlTrx, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let dataTrx = await resTrx.json()
            if (dataTrx) {
                if (dataTrx.transaction.logs) {
                    dataTrx.transaction.logs.map((item, index) => {
                        try {
                            if (Buffer.from(item, 'base64').byteLength === 8) {
                                const buffer = Buffer.from(item, 'base64');
                                let uint64Log = buffer.readUIntBE(2, 6)
                                this.logger.info(`GoraDAO TXN log [${index}]:uint64:  %s`, uint64Log)
                            } else {
                                let log = atob(item)
                                this.logger.info(`GoraDAO TXN log [${index}]:bytes: %s`, log)
                            }
                        } catch (error) {
                            this.logger.error(error)
                        }
                    })


                }
            }


        }
    }
    async printAppGlobalState(appId) {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {
            const urlApp = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/applications/${appId}`;

            let resApp = await fetch(urlApp, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let dataApp = await resApp.json()
            if (dataApp) {
                if (dataApp.params["global-state"]) {
                    let gs = dataApp.params["global-state"];
                    let gsKeys = Object.keys(gs);
                    for (let i = 0; i < gsKeys.length; i++) {
                        let k = gsKeys[i];


                        let kv = gs[k];
                        let gsValueDecoded = null;
                        let keyStr = Buffer.from(
                            kv.key,
                            "base64"
                        ).toString();
                        this.logger.info('GoraDAO App Global State Key: %s', keyStr)
                        if (kv.value.bytes !== "" && kv.value.uint === 0) {
                            try {
                                let buf = Buffer.from(kv.value.bytes, "base64");
                                let uintArr = new Uint8Array(buf);
                                let addr = algosdk.encodeAddress(uintArr);
                                if (algosdk.isValidAddress(addr)) {
                                    gsValueDecoded = algosdk.encodeAddress(uintArr);
                                } else {
                                    throw new Error();
                                }
                            } catch (error) {
                                let buf = Buffer.from(kv.value.bytes, "base64");
                                let uintArr = new Uint8Array(buf);
                                //uintArr = uintArr.slice(2, uintArr.length);
                                gsValueDecoded = new TextDecoder().decode(uintArr);
                            }
                        } else if (kv.value.uint > 0) {
                            gsValueDecoded = kv.value.uint;
                        }
                        this.logger.info('GoraDAO GlobalState Uint64 value: %s', gsValueDecoded)
                    }
                }
            }


        }
    }
    async printCreatedAsset() {
        let accountInfo = await this.indexerClient.lookupAccountByID(this.accountObject.addr).do();
        this.accountBalance = accountInfo.account.amount
        this.assetsCreated = accountInfo['account']["created-assets"]
        this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0

        this.logger.info('------------------------------')
        this.logger.info("Printed Account Balance = %s", this.accountBalance);
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Created Assets = %s", JSON.stringify(!!this.assetsCreated ? this.assetsCreated.length : {}, null, 2));
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Created Assets Balance= %s", this.assetsHeldBalance);
        this.logger.info('------------------------------')

        if (!!this.assetsCreated) {
            for (let idx = 0; idx < accountInfo['account']['created-assets'].length; idx++) {
                let sAsset = accountInfo['account']['created-assets'][idx];
                if (assetid) {
                    if (sAsset['index'] == assetid) {
                        let params = JSON.stringify(sAsset['params'], null, 2);
                        this.logger.info('------------------------------')
                        this.logger.info("AssetID = %s", sAsset['index']);
                        this.logger.info("Asset params = %s", params);
                        break;
                    }
                } else {
                    let params = JSON.stringify(sAsset['params'], null, 2);
                    this.logger.info('------------------------------')
                    this.logger.info("Created AssetID = %s", sAsset['index']);
                    this.logger.info("Created Asset Info = %s", params);
                }
            }
        }
    }
    async printAssetHolding(account, assetid) {
        let accountInfo = await this.indexerClient.lookupAccountByID(account).do();
        this.accountBalance = accountInfo.account.amount
        this.assetsHeld = accountInfo.account.assets
        this.assetsHeldBalance = !!this.assetsHeld ? this.assetsHeld.length : 0

        this.logger.info('------------------------------')
        this.logger.info("Printed Account Balance = %s", this.accountBalance);
        this.logger.info('------------------------------')

        this.logger.info("Printed Account Held Assets = %s", JSON.stringify(!!this.assetsHeld ? this.assetsHeld.length : {}, null, 2));
        this.logger.info('------------------------------')
        this.logger.info("Printed Account Held Assets Balance= %s", this.assetsHeldBalance);
        this.logger.info('------------------------------')

        if (!!this.assetsHeld) {
            for (let idx = 0; idx < accountInfo['account']['assets'].length; idx++) {
                let sAsset = accountInfo['account']['assets'][idx];
                if (assetid) {
                    if (sAsset['asset-id'] == assetid) {
                        let assetHoldings = JSON.stringify(sAsset, null, 2);
                        this.logger.info("Printed Held Asset Info = %s", assetHoldings);
                        break;
                    }
                } else {
                    let assetHoldings = JSON.stringify(sAsset, null, 2);
                    this.logger.info('------------------------------')
                    this.logger.info("Printed Held AssetID = %s", sAsset['asset-id']);
                    this.logger.info("Printed Held Asset Info = %s", assetHoldings);
                }
            }
        }
    }
    //TODO OPS
    async deployerReport() {
        try {
            await this.fetchAlgoWalletInfo();
            await this.printCreatedAsset();
            await this.printAssetHolding(this.accountObject.addr);
        }
        catch (err) {
            this.logger.error(err);
        }
    }
    async deleteApps(appsToDelete) {
        let wallet = this.config.gora_dao.algo_wallet_address
        let apps = appsToDelete || [];
        for (let i = 0; i < apps.length; i++) {
            this.logger.info('Now deleting GoraDAO APP: %s', apps[i])
            let params = await this.algodClient.getTransactionParams().do();
            params.fee = 1000;
            params.flatFee = true;
            let sender = wallet;
            let note = this.algosdk.encodeObj(
                JSON.stringify({
                    system: "Deleting GoraDAO app",
                    date: `${new Date()}`,
                })
            );
            let txn = this.algosdk.makeApplicationDeleteTxnFromObject({
                suggestedParams: params,
                type: "appl",
                appIndex: Number(apps[i]),
                from: sender,
                appOnComplete: 5,
                note: note,
                closeRemainderTo: undefined,
                revocationTarget: undefined,
                rekeyTo: undefined,
            });
            const signedTxn = txn.signTxn(this.accountObject.sk);
            const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txId, 5)
            let ptx = await this.algodClient.pendingTransactionInformation(txId).do();
            const noteArrayFromTxn = ptx.txn.txn.note;
            const receivedNote = Buffer.from(noteArrayFromTxn).toString('utf8');
            this.logger.info("Note from confirmed GoraDAO Delete TXN: %s", receivedNote);
        }

    }
    async deployerAccount() {
        try {
            const accounts = await this.importAccount();
            this.accountObject = accounts.acc
        }
        catch (err) {
            this.logger.error(err);
        }
    }
    async deployMainContract() {
        let addr = this.accountObject.addr;
        let localInts = this.config.deployer['num_local_int'];
        let localBytes = this.config.deployer['num_local_byte'];
        let globalInts = this.config.deployer['num_global_int'];
        let globalBytes = this.config.deployer['num_global_byte'];
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.NoOpOC;

        const compiledResult = await this.algodClient.compile(this.approvalProgData).do();
        const compiledClearResult = await this.algodClient.compile(this.clearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Contract Hash = %s", compiledResult.hash);
        //this.logger.info("GoraNetwork Main Contract Result = %s", compiledResult.result)
        this.logger.info("GoraNetwork Clear Hash = %s", compiledClearResult.hash);
        //this.logger.info("GoraNetwork Clear Result = %s", compiledClearResult.result);
        params.fee = 1000
        params.flatFee = true
        let appTxn = this.algosdk.makeApplicationCreateTxnFromObject({
            from: addr, suggestedParams: params, onComplete,
            approvalProgram: compiledResultUint8, clearProgram: compiledClearResultUint8,
            numLocalInts: localInts, numLocalByteSlices: localBytes, numGlobalInts: globalInts, numGlobalByteSlices: globalBytes, extraPages: 0
        });
        let appTxnId = appTxn.txID().toString();

        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application Creation TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(this.accountObject.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)

        let transactionResponse = await this.algodClient.pendingTransactionInformation(appTxnId).do();
        let appId = transactionResponse['application-index'];
        await this.printTransactionLogs(appTxnId)
        await this.printAppGlobalState(appId)
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application ID: %s", appId);
        this.logger.info('------------------------------')
        this.applicationId = appId
        this.applicationAddr = this.algosdk.getApplicationAddress(appId);
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application Address: %s", this.algosdk.getApplicationAddress(Number(appId)));
        this.logger.info('------------------------------')
    }
    async updateMainContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.UpdateApplicationOC;
        const compiledResult = await this.algodClient.compile(this.approvalProgData).do();
        const compiledPyTealResult = await this.algodClient.compile(this.approvalPyTealProgData).do();
        const compiledClearResult = await this.algodClient.compile(this.clearProgData).do();
        this.logger.info("GoraNetwork Main Contract Hash = %s", compiledResult.hash);
        this.logger.info("GoraNetwork Main Contract Result = %s", compiledResult.result)
        this.logger.info("GoraNetwork Clear Hash = %s", compiledClearResult.hash);
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));
        const compiledResultPyTealUint8 = new Uint8Array(Buffer.from(compiledPyTealResult.result, "base64"));
        this.logger.info('Compiled Result Uint8Array: ', compiledResultUint8)
        this.logger.info('Compiled Result PyTeal Uint8Array: ', compiledResultPyTealUint8)
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));

        this.logger.info('------------------------------')


        let appTxn = this.algosdk.makeApplicationUpdateTxn(addr, params, Number(this.applicationId),
            compiledResultUint8, compiledClearResultUint8, /* [this.algosdk.encodeUint64(1), this.algosdk.encodeUint64(1)] */);
        let appTxnId = appTxn.txID().toString();

        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application Update TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(this.accountObject.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)

        let transactionResponse = await this.algodClient.pendingTransactionInformation(appTxnId).do();
        let appId = transactionResponse['application-index'];
        await this.printTransactionLogs(appTxnId)
        await this.printAppGlobalState(this.applicationId)
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Updated Main Application ID: %s", this.applicationId);
        this.logger.info('------------------------------')

        this.applicationAddr = this.algosdk.getApplicationAddress(Number(this.applicationId));
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Updated Main Application Address: %s", this.applicationAddr);
        this.logger.info('------------------------------')
    }
    async runDeployer() {
        await this.deployerAccount()
        if (this.config.deployer['deployer_report']) await this.deployerReport();
        if (this.config.deployer['create_dao_contracts']) await this.deployMainContract();
        if (this.config.deployer['update_dao_contracts']) await this.updateMainContract();
        if (this.config.deployer['delete_apps']) await this.deleteApps(this.config.deployer.apps_to_delete);
        //TODO OPS
        process.exit();
    }
}

module.exports = GoraDaoDeployer