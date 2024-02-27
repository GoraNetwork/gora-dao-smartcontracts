const fetch = require('node-fetch');
const sha512_256 = require('js-sha512').sha512_256;
const base32 = require('hi-base32');
// GoraDAO deployer Class
const GoraDaoDeployer = class {
    // Class constructor
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


        // GoraDAO Main Application ID
        this.goraDaoMainApplicationId = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_main_id : props.config.gora_dao.asc_main_id
        // GoraDAO Main Application Address
        this.goraDaoMainApplicationAddress = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_main_address : props.config.gora_dao.asc_main_address

        // GoraDAO Proposal application ID
        this.proposalApplicationId = props.config.gora_dao.asc_proposal_id
        // GoraDAO Proposal application Address
        this.proposalApplicationAddress = props.config.gora_dao.asc_proposal_address
        // GoraDAO Proposal Asset ID
        this.goraDaoAsset = props.config.gora_dao.main_asa_id
        this.proposalAsset = props.config.gora_dao.proposal_asa_id

        // GoraDao Main contracts
        this.daoContract = props.daoContract
        this.daoApprovalProgData = props.daoApprovalProgData
        this.daoClearProgData = props.daoClearProgData

        // GoraDao Proposal contracts
        this.proposalContract = props.proposalContract
        this.proposalApprovalProgData = props.proposalApprovalProgData
        this.proposalClearProgData = props.proposalClearProgData

        // GoraDao Vesting contracts
        this.vestingContract = props.vestingContract
        this.vestingApprovalProgData = props.vestingApprovalProgData
        this.vestingClearProgData = props.vestingClearProgData


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
    // Imports the accounts from Mnemonics
    importAccount() {
        const acc = this.algosdk.mnemonicToSecretKey(this.mnemonic0);
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
    // Gets the contract method instance for a given method
    getMethodByName(name, contract) {
        const m = contract.methods.find((mt) => { return mt.name == name })
        if (m === undefined)
            throw Error("Method undefined: " + name)
        return m
    }
    // Gets the balance information for GoraDAO account address
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
    // This method detects failed decoding string results
    hasBadChars(str) {
        const regex = /[^\x00-\x7F]/g;
        return str.match(regex) !== null;
    }
    // Gets the stateproof for the transaction in specified round
    async fetchTransactionStateProof(txID, round) {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {
            ///v2/blocks/{round}/transactions/{txid}/proof

            const url = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/blocks/${round}/transactions/${txID}/proof`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let data = await res.json()
            if (data) {
                if (data) {
                    this.logger.info(`GoraDAO Transaction StateProof: ${JSON.stringify(data, null, 2)}`)
                    return data
                }
                return null

            }
            return null
        }
    }
    // This is the method to get transaction logs from indexer endpoints
    async printTransactionLogsFromIndexer(txID, confirmedRound) {
        try {
            if (this.algosdk.isValidAddress(this.accountObject.addr)) {

                //this.logger.info(` The ${txnName} TxnID being logged: ${txID}`)

                const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['indexer_testnet_remote_server'] : this.config.gora_dao['indexer_remote_server']}/v2/transactions/${txID}`;

                let resTrx = await fetch(urlTrx, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
                let dataTrx = await resTrx.json()

                if (dataTrx && dataTrx.transaction) {
                    if (dataTrx && dataTrx.transaction) {
                        if (dataTrx.transaction.logs) {
                            dataTrx.transaction.logs.map((item, index) => {

                                try {
                                    let address = this.algosdk.decodeAddress(item)
                                    if (this.algosdk.isValidAddress(address)) {
                                        this.logger.info(`  TXN log [${index}]:Address: %s`, address)
                                    }
                                } catch (error) {
                                    try {
                                        let address = this.algosdk.encodeAddress(Buffer.from(item, 'base64'))
                                        if (this.algosdk.isValidAddress(address)) {
                                            this.logger.info(`  TXN log [${index}]:Address: %s`, address)
                                        } else {
                                            throw new Error()
                                        }

                                    } catch (error) {
                                        let buff = Buffer.from(item, 'base64')
                                        if (buff.byteLength === 32) {
                                            let logTxId = base32.encode(buff).replace(/=/g, '').slice(0, 52)
                                            if (logTxId) {
                                                this.logger.info(`  TXN log [${index}]:TXID: %s`, logTxId)
                                            }
                                        } else {
                                            if (Buffer.from(item, 'base64').byteLength === 12) {
                                                const buffer = Buffer.from(item, 'base64');
                                                let uint64Log = this.algosdk.decodeUint64(buffer.slice(4, 12), "mixed")
                                                this.logger.info(` TXN log [${index}]:uint64:  %s`, uint64Log)
                                            } else if (Buffer.from(item, 'base64').byteLength === 8) {
                                                const buffer = Buffer.from(item, 'base64');
                                                let uint64Log = this.algosdk.decodeUint64(buffer, "mixed")
                                                this.logger.info(` TXN log [${index}]:uint64:  %s`, uint64Log)
                                            } else {
                                                let log = atob(item)
                                                if (!this.hasBadChars(log)) {
                                                    this.logger.info(`  TXN log [${index}]:ATOB bytes: %s`, log)
                                                } else {
                                                    const buffer = Buffer.from(item)
                                                    const log = buffer.toString()
                                                    this.logger.info(` TXN log [${index}]:BUFFER STRING bytes: %s`, log)
                                                }
                                            }

                                        }

                                    }


                                }
                            })


                        }

                    }
                    // if (dataTrx.transaction["inner-txns"] && dataTrx.transaction["inner-txns"][0].logs) {
                    //     dataTrx.transaction["inner-txns"][0].logs.map((item, index) => {
                    //         try {
                    //             if (Buffer.from(item, 'base64').byteLength === 8) {
                    //                 const buffer = Buffer.from(item, 'base64');
                    //                 let uint64Log = buffer.readUIntBE(2, 6)
                    //                 this.logger.info(` ${txnName} INNER TXN LOG [${index}]:uint64:  %s`, uint64Log)
                    //             } else {
                    //                 //let log = atob(item)
                    //                 let log = msgpack.decode(item)
                    //                 this.logger.info(` ${txnName} INNER TXN LOG [${index}]:bytes: %s`, log)
                    //             }
                    //         } catch (error) {
                    //             this.logger.error(error)
                    //         }
                    //     })


                    // }
                }
            }
        } catch (error) {
            console.error(error)
        }

    }
    // This is the method to get transaction logs from algod /blocks/{round} endpoint
    async printTransactionLogsFromBlocks(txID, confirmedRound, txnName) {
        if (this.algosdk.isValidAddress(this.accountObject.addr)) {

            this.logger.info(` The TxnID being logged: ${txID}`)
            const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_desense['algod_remote_server']}/v2/blocks/${confirmedRound}`;

            let resTrx = await fetch(urlTrx, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let dataTrx = await resTrx.json()
            if (dataTrx) {
                if (dataTrx.block && dataTrx.block.txns) {
                    const block = dataTrx.block
                    let txnBody
                    let innerTxnBody

                    dataTrx.block.txns.map((item, index) => {
                        try {
                            if (item && item.txn && item.dt && item.dt.lg && item.txn.snd === this.accountObject.addr) {

                                let logData = item.dt.lg
                                let innerTxnData = Array.isArray(item.dt.itx) ? item.dt.itx[0] : item.dt.itx
                                txnBody = item
                                innerTxnBody = innerTxnData
                                logData.map((log, logIndex) => {
                                    try {
                                        const decodedAddress = this.algosdk.decodeAddress(log)
                                        this.logger.info(`  log decodedAddress [${logIndex}]: %s`, decodedAddress)

                                    } catch (error) {
                                        //console.log('Address SDK decoding failed!')
                                        try {
                                            const logDecoded = atob(log)
                                            this.logger.info(`  log ATOB [${logIndex}]: %s`, logDecoded)
                                        } catch (error) {
                                            try {
                                                const buffer = Buffer.from(log);
                                                const decodedUint64 = buffer.readUIntBE(2, 6)
                                                // this.logger.info(`  TXN log [${logIndex}]:  %s`, decodedUint64)
                                                // this.logger.info(`  TXN  SDK [${logIndex}]:  %s`,  this.algosdk.decodeUint64(log))
                                                // const decodedUint64 = this.algosdk.decodeUint64(log)

                                                if (decodedUint64 > 0 && decodedUint64 < 9999999999) {
                                                    this.logger.info(`  log decodedUint64 [${logIndex}]: %s`, decodedUint64)
                                                } else if (Buffer.from(log).byteLength === 8 && decodedUint64 === 0) {
                                                    this.logger.info(`  log decodedUint64 [${logIndex}]: %s`, 0)
                                                } else if (logIndex === logData.length - 1) {
                                                    const buffer = new Uint8Array(Buffer.from(log)).slice(4);
                                                    const decodedUint64 = Buffer.from(buffer).readUIntBE(2, 6)
                                                    if (decodedUint64 > 0 && decodedUint64 < 9999999999) {
                                                        this.logger.info(`  log decodedUint64 [${logIndex}]: %s`, decodedUint64)
                                                    } else {
                                                        //let uintArr = this.concatArrays([new Uint8Array(Buffer.from("TX")), new Uint8Array(buffer)]);
                                                        const buffer = new Uint8Array(Buffer.from(log)).slice(4);
                                                        let uintArr = new Uint8Array(buffer);
                                                        const logDecoded = base32.encode(buffer).replace(/=/g, '').slice(0, 52);
                                                        this.logger.info(`  log RETURN TxID decoded [${logIndex}]: %s`, logDecoded)


                                                    }
                                                } else {
                                                    throw new Error();
                                                }
                                            } catch (error) {

                                                let res = Buffer.from(log)
                                                let logDecoded = base32.encode(res).replace(/=/g, '').slice(0, 52)
                                                this.logger.info(`  log TxID decoded [${logIndex}]: %s`, logDecoded)

                                            }

                                        }

                                    }
                                })

                            }
                        } catch (error) {
                            //this.logger.error(error)

                        }
                    })
                    return {
                        block,
                        txnBody,
                        innerTxnBody
                    }


                }

            }

        }
    }
    // Prints the global state for a given application ID
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
    // Prints the created assets for a given account address
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
    // Prints the held assets for a given account address
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
    // Prints the general report on GoraDAO account
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
    // Deletes GoraDAO applications
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
    // Grabs the accounts from Mnemonics
    async deployerAccount() {
        try {
            const accounts = await this.importAccount();
            this.accountObject = accounts.acc
        }
        catch (err) {
            this.logger.error(err);
        }
    }
    // Deploying GoraDAO Main Contract
    async deployMainContract() {
        let addr = this.accountObject.addr;
        let localInts = this.config.deployer['num_local_int'];
        let localBytes = this.config.deployer['num_local_byte'];
        let globalInts = this.config.deployer['num_global_int'];
        let globalBytes = this.config.deployer['num_global_byte'];
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.NoOpOC;

        const compiledResult = await this.algodClient.compile(this.daoApprovalProgData).do();
        const compiledClearResult = await this.algodClient.compile(this.daoClearProgData).do();
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
        await this.printTransactionLogsFromIndexer(appTxnId)
        await this.printAppGlobalState(appId)
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application ID: %s", appId);
        this.logger.info('------------------------------')
        this.goraDaoMainApplicationId = appId
        this.goraDaoMainApplicationAddress = this.algosdk.getApplicationAddress(appId);


        this.logger.info("GoraNetwork Main Application Address: %s", this.algosdk.getApplicationAddress(Number(appId)));
        this.logger.info('------------------------------')
        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 3000000,
            fee: params.minFee,
            ...params
        })
        let signedPayTxn = ptxn.signTxn(this.accountObject.sk);

        await this.algodClient.sendRawTransaction(signedPayTxn).do();
        this.logger.info("GoraNetwork Main Application Address: %s funded!", this.goraDaoMainApplicationAddress);
        this.logger.info('------------------------------')
    }
    // Updating GoraDAO Main Contract
    async updateMainContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let onComplete = this.algosdk.OnApplicationComplete.UpdateApplicationOC;
        const compiledResult = await this.algodClient.compile(this.daoApprovalProgData).do();

        const compiledClearResult = await this.algodClient.compile(this.daoClearProgData).do();
        this.logger.info("GoraNetwork Main Contract Hash = %s", compiledResult.hash);
        this.logger.info("GoraNetwork Main Contract Result = %s", compiledResult.result)
        this.logger.info("GoraNetwork Clear Hash = %s", compiledClearResult.hash);
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledResult.result, "base64"));

        this.logger.info('Compiled Result Uint8Array: ', compiledResultUint8)

        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledClearResult.result, "base64"));

        this.logger.info('------------------------------')


        let appTxn = this.algosdk.makeApplicationUpdateTxn(addr, params, Number(this.goraDaoMainApplicationId),
            compiledResultUint8, compiledClearResultUint8, /* [this.algosdk.encodeUint64(1), this.algosdk.encodeUint64(1)] */);
        let appTxnId = appTxn.txID().toString();

        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application Update TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(this.accountObject.sk);
        await this.algodClient.sendRawTransaction(signedAppTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, appTxnId, 5)

        let transactionResponse = await this.algodClient.pendingTransactionInformation(appTxnId).do();
        let appId = transactionResponse['application-index'];
        await this.printTransactionLogsFromIndexer(appTxnId)
        await this.printAppGlobalState(this.goraDaoMainApplicationId)
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Updated Main Application ID: %s", this.goraDaoMainApplicationId);
        this.logger.info('------------------------------')

        this.goraDaoMainApplicationAddress = this.algosdk.getApplicationAddress(Number(this.goraDaoMainApplicationId));
        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Updated Main Application Address: %s", this.goraDaoMainApplicationAddress);
        this.logger.info('------------------------------')
    }
    async createDaoAsset() {

        let params = await this.algodClient.getTransactionParams().do();
        const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
            assetMetadataHash: new Uint8Array(32),
            assetName: 'GoraDAO TEST ASSET',
            assetURL: 'https://gora.io',
            clawback: this.accountObject.addr,
            decimals: 0,
            defaultFrozen: false,
            freeze: this.accountObject.addr,
            from: this.accountObject.addr,
            manager: this.accountObject.addr,
            note: new Uint8Array(Buffer.from('GoraDAO TEST Asset')),
            reserve: this.accountObject.addr,
            suggestedParams: { ...params, fee: 1000, flatFee: true, },
            total: 1000000,
            unitName: 'GDT',

        })



        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Asset Creation...");
        let txnId = atxn.txID().toString();
        let signedTxn = await atxn.signTxn(this.accountObject.sk);
        await this.algodClient.sendRawTransaction(signedTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

        let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
        let assetId = transactionResponse['asset-index'];
        this.logger.info(`GoraDAO created TEST Asset ID: ${assetId}`);

    }
    async createDaoProposalAsset() {

        let params = await this.algodClient.getTransactionParams().do();
        const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
            assetMetadataHash: new Uint8Array(32),
            assetName: 'GoraDAO Proposal TEST ASSET',
            assetURL: 'https://gora.io',
            clawback: this.accountObject.addr,
            decimals: 0,
            defaultFrozen: false,
            freeze: this.accountObject.addr,
            from: this.accountObject.addr,
            manager: this.accountObject.addr,
            note: new Uint8Array(Buffer.from('GoraDAO Proposal TEST Asset')),
            reserve: this.accountObject.addr,
            suggestedParams: { ...params, fee: 1000, flatFee: true, },
            total: 1000000,
            unitName: 'GDPT',

        })



        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Asset Creation...");
        let txnId = atxn.txID().toString();
        let signedTxn = await atxn.signTxn(this.accountObject.sk);
        await this.algodClient.sendRawTransaction(signedTxn).do();
        await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

        let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
        let assetId = transactionResponse['asset-index'];
        this.logger.info(`GoraDAO Proposal TEST created Asset ID: ${assetId}`);

    }
    async configMainContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let application = Number(this.goraDaoMainApplicationId)
        const contract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        let methodDaoConfig = this.getMethodByName("config_dao", contract)
        const commonParamsSetup = {
            appID: application,
            accounts: [addr],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                // { appIndex: Number(application), name: addrUint8Array.publicKey },
                // { appIndex: Number(application), name: addrUint8Array.publicKey },



            ],
        }
        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 0,
            fee: params.minFee,
            ...params
        })

        const tws0 = { txn: ptxn, signer: signer }
        //(pay,asset,account)string
        const args = [
            tws0,
            Number(this.goraDaoAsset),
            addr,
            Number(this.goraDaoAsset),
            //min_subscription
            2000,
            //proposal_fee
            10,
            //proposal_fee_algo
            500000,
            // min_subscription_algo
            1000000,
            // min_subscription_fee
            142000,

        ]
        const atcDaoConfig = new this.algosdk.AtomicTransactionComposer()

        atcDaoConfig.addMethodCall({
            method: methodDaoConfig,
            accounts: [this.goraDaoMainApplicationAddress],
            methodArgs: args,
            ...commonParamsSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodDaoConfig);
        const daoConfigResults = await atcDaoConfig.execute(this.algodClient, 10);
        for (const idx in daoConfigResults.methodResults) {

            let txid = daoConfigResults.txIDs[idx]


            let confirmedRound = daoConfigResults.confirmedRound
            //let sp = await this.fetchTransactionStateProof(txid, confirmedRound)
            ///v2/blocks/{round}/transactions/{txid}/proof
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

            let returnedResults = this.algosdk.decodeUint64(daoConfigResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Contract ABI Exec result = %s", returnedResults);
            //this.logger.info("GoraDAO Transaction StateProof %s", sp);
        }
    }
    async subscribeDaoContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)

        const contractJson = JSON.parse(this.daoContract.toString())
        const contract = new this.algosdk.ABIContract(contractJson)

        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("subscribe_dao", contract)

        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 3000,
            fee: params.minFee,
            ...params
        })


        const tws0 = { txn: ptxn, signer: signer }


        atc.addMethodCall({
            method: method,
            methodArgs: [
                tws0,//pay
                Number(this.goraDaoAsset),
                addr,// member account 
                addr,// member account 
            ],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", addr);


            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    async unsubscribeDaoContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)

        const contractJson = JSON.parse(this.daoContract.toString())
        const contract = new this.algosdk.ABIContract(contractJson)

        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("unsubscribe_dao", contract)




        atc.addMethodCall({
            method: method,
            methodArgs: [

                Number(this.goraDaoAsset),
                addr,// member account 
                addr,// member account 
            ],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", addr);


            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // Only temporary because the actual GoraDao contracts will not be updatable
    async writeProposalContractSourceBox() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject);
        const compiledItemResult = await this.algodClient.compile(this.proposalApprovalProgData).do();
        const compiledItemClearResult = await this.algodClient.compile(this.proposalClearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))


        const commonParams = {
            sender: addr,
            suggestedParams: params,
            signer: signer,
            fee: 1000
        }
        let method = this.getMethodByName("write_source_box", contract)
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))
        atc.addMethodCall({
            appID: Number(this.goraDaoMainApplicationId),
            method: method,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
            ],
            methodArgs: [compiledResultUint8, compiledClearResultUint8],


            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Main Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (const idx in result.methodResults) {

            let buff = Buffer.from(result.methodResults[idx].rawReturnValue, "base64")
            let res = buff.toString()
            this.logger.info("GoraDAO Main Contract ABI Exec method result = %s", res);


        }
    }

    // Create GoraDAO Proposal Contract
    async createProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        // const compiledItemResult = await this.algodClient.compile(this.proposalApprovalProgData).do();
        // const compiledItemClearResult = await this.algodClient.compile(this.proposalClearProgData).do();
        // const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        // const compiledResultUint8Dummy = new Uint8Array(compiledResultUint8.length);
        // const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contractJson = JSON.parse(this.daoContract.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)
        this.logger.info(`${Number(this.proposalAsset)} ${Number(this.goraDaoAsset)}`)
        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,

            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("create_proposal", contract)

        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 500000,
            fee: params.minFee,
            ...params
        })


        const tws0 = { txn: ptxn, signer: signer }


        atc.addMethodCall({
            method: method,

            methodArgs: [
                tws0,//pay
                addr,// member account (Proposal manager)
                Number(this.proposalAsset),// Proposal asset ref
                Number(this.goraDaoAsset),// DAO asset ref
                Number(this.proposalAsset),// Proposal asset id
                "Proposal_Test",//title
                "This is a test proposal for GoraDAO",//description
                // 10,//quorum
                // [2, [100, 100, 52], [80, 80, 60]],//threshold
                // 12,//total duration
                // 10000,//amount
                // [1, [10, 30, 60]],//vesting_schedule
                // 2,//voting duration
            ],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", addr);
            this.logger.info("GoraDAO Proposal Contract topped up by 0.3 Algo!");

            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)


        }
    }
    // Only temporary because the actual GoraDao contracts will not be updatable
    async updateProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)

        const contractJson = JSON.parse(this.daoContract.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("update_proposal", contract)

        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 3000,
            fee: params.minFee,
            ...params
        })


        const tws0 = { txn: ptxn, signer: signer }


        atc.addMethodCall({
            method: method,
            methodArgs: [
                tws0,//pay
                Number(this.proposalApplicationId),
                Number(this.proposalApplicationId),
                addr,// member account (Proposal manager)
                Number(this.proposalAsset),// Proposal asset
                "Proposal_Test_updated",//title
                "This is an updated test proposal for GoraDAO",//description
                // 10,//quorum
                // [2, [100, 100, 52], [80, 80, 60]],//threshold
                // 12,//total duration
                // 10000,//amount
                // [1, [10, 30, 60]],//vesting_schedule
                // 2,//voting duration
            ],
            ...commonParams
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Proposal Contract ABI Exec method result = %s", addr);


            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // Configures and sets parameters of a proposal contract (before proposal activation)
    async configureProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const daoContract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        let methodProposalConfig = this.getMethodByName("config_proposal", proposalContract)
        let methodDaoProposalConfig = this.getMethodByName("config_proposal", daoContract)

        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)
        const commonParamsProposalSetup = {
            appID: proposalApplication,

            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("proposal_threshold")) },
                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },


            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,

            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },



            ],
        }
        const axferProposal = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 10,
            assetIndex: Number(this.goraDaoAsset),
            type: 'axfer',
            ...params
        })
        const ptxnProposal = new this.algosdk.Transaction({
            from: addr,
            to: this.proposalApplicationAddress,
            amount: 110000,
            type: 'pay',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 3000,
            type: 'pay',
            ...params
        })

        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: ptxnProposal, signer: signer }
        const tws2 = { txn: axferProposal, signer: signer }
        const argsDao = [
            tws0,
            tws2,
            addr,
            this.proposalAsset,
            this.goraDaoAsset,
            this.proposalApplicationId,
            this.proposalApplicationAddress,
            this.proposalAsset,


        ]




        //this.goraDaoMainApplicationId,
        const argsProposal = [
            tws1,
            this.proposalAsset,
            this.proposalAsset,
            addr,
            addr,
            100000,
            100,
            72,
            10000,
            this.proposalAsset,
            24,
            0,
            2000,
            10,
            145000,
            [10001, 100, 52, 80, 80, 60],
        ]
        const atcProposalConfig = new this.algosdk.AtomicTransactionComposer()

        atcProposalConfig.addMethodCall({
            method: methodProposalConfig,
            accounts: [this.goraDaoMainApplicationAddress],
            methodArgs: argsProposal,
            ...commonParamsProposalSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodDaoProposalConfig);
        atcProposalConfig.addMethodCall({
            method: methodDaoProposalConfig,
            accounts: [this.proposalApplicationAddress],
            methodArgs: argsDao,
            ...commonParamsDaoSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodProposalConfig);
        const proposalConfigResults = await atcProposalConfig.execute(this.algodClient, 10);
        for (const idx in proposalConfigResults.methodResults) {
            let txid = proposalConfigResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalConfigResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(proposalConfigResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // participates to a proposal from e member account
    async participateProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const daoContract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        let methodProposalParticipate = this.getMethodByName("proposal_participate", proposalContract)
        let methodDaoProposalParticipate = this.getMethodByName("proposal_participate", daoContract)
        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)
        const commonParamsProposalSetup = {
            appID: proposalApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },


            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }

        const ptxnProposal = new this.algosdk.Transaction({
            from: addr,
            to: this.proposalApplicationAddress,
            amount: 2000,
            type: 'pay',
            ...params
        })
        const axferDao = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 100,
            assetIndex: Number(this.goraDaoAsset),
            type: 'axfer',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 120000,
            type: 'pay',
            ...params
        })

        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: axferDao, signer: signer }
        const tws2 = { txn: ptxnProposal, signer: signer }
        const argsDao = [
            tws0,
            tws1,
            this.goraDaoAsset,
            addr,
            this.proposalApplicationId

        ]

        const argsProposal = [
            tws2,
            this.goraDaoAsset,
            addr,
            this.goraDaoMainApplicationId,
        ]
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalParticipate);
        atcProposalParticipate.addMethodCall({
            method: methodProposalParticipate,
            methodArgs: argsProposal,
            ...commonParamsProposalSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodDaoProposalParticipate);

        const proposalParticipateResults = await atcProposalParticipate.execute(this.algodClient, 10);
        for (const idx in proposalParticipateResults.methodResults) {
            let txid = proposalParticipateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalParticipateResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(proposalParticipateResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }

    }
    async participationWithdrawProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const daoContract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        let methodProposalParticipate = this.getMethodByName("proposal_withdraw_participate", proposalContract)
        let methodDaoProposalParticipate = this.getMethodByName("proposal_withdraw_participate", daoContract)
        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)
        const commonParamsProposalSetup = {
            appID: proposalApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },


            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }


        const argsDao = [

            this.goraDaoAsset,
            addr,
            this.proposalApplicationId

        ]

        const argsProposal = [

            this.goraDaoAsset,
            addr,
            this.goraDaoMainApplicationId,
        ]
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalParticipate);
        atcProposalParticipate.addMethodCall({
            method: methodProposalParticipate,
            methodArgs: argsProposal,
            ...commonParamsProposalSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodDaoProposalParticipate);

        const proposalParticipateResults = await atcProposalParticipate.execute(this.algodClient, 10);
        for (const idx in proposalParticipateResults.methodResults) {
            let txid = proposalParticipateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalParticipateResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(proposalParticipateResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }

    }
    async activateProposalContract() { }
    async voteProposalContract() {
        let addr = this.accountObject.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const daoContract = new this.algosdk.ABIContract(JSON.parse(this.daoContract.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.accountObject)
        let methodProposalParticipate = this.getMethodByName("proposal_vote", proposalContract)
        let methodDaoProposalParticipate = this.getMethodByName("proposal_vote", daoContract)
        let memberPublicKey = this.algosdk.decodeAddress(this.accountObject.addr)
        const commonParamsProposalSetup = {
            appID: proposalApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },


            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }

        const ptxnProposal = new this.algosdk.Transaction({
            from: addr,
            to: this.proposalApplicationAddress,
            amount: 3000,
            type: 'pay',
            ...params
        })
        const axferDao = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 10,
            assetIndex: Number(this.goraDaoAsset),
            type: 'axfer',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 145000,
            type: 'pay',
            ...params
        })

        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: axferDao, signer: signer }
        const tws2 = { txn: ptxnProposal, signer: signer }
        const argsDao = [
            tws0,
            tws1,
            this.goraDaoAsset,
            addr,
            this.proposalApplicationId,
            1

        ]

        const argsProposal = [
            tws2,
            this.goraDaoAsset,
            addr,
            this.goraDaoMainApplicationId,
            1
        ]
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalParticipate);
        atcProposalParticipate.addMethodCall({
            method: methodProposalParticipate,
            methodArgs: argsProposal,
            ...commonParamsProposalSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodDaoProposalParticipate);

        const proposalParticipateResults = await atcProposalParticipate.execute(this.algodClient, 10);
        for (const idx in proposalParticipateResults.methodResults) {
            let txid = proposalParticipateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalParticipateResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(proposalParticipateResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }

    // Running GoraDAO deployer
    async runDeployer() {
        // Running deployer account instantiation
        await this.deployerAccount()
        if (this.config.deployer['deployer_report']) await this.deployerReport();

        // Running deployer DAO main contract operations
        if (this.config.deployer['create_dao_contracts']) await this.deployMainContract();
        if (this.config.deployer['update_dao_contracts']) await this.updateMainContract();
        if (this.config.deployer['create_dao_asset']) await this.createDaoAsset();
        if (this.config.deployer['create_dao_proposal_asset']) await this.createDaoProposalAsset();
        if (this.config.deployer['config_dao_contract']) await this.configMainContract();
        if (this.config.deployer['subscribe_dao_contract']) await this.subscribeDaoContract();
        if (this.config.deployer['unsubscribe_dao_contract']) await this.unsubscribeDaoContract();
        if (this.config.deployer['delete_apps']) await this.deleteApps(this.config.deployer.apps_to_delete);

        // Running deployer DAO proposal contract operations
        if (this.config.deployer['write_proposal_source_box']) await this.writeProposalContractSourceBox();
        if (this.config.deployer['create_proposal_contracts']) await this.createProposalContract();
        if (this.config.deployer['update_proposal_contracts']) await this.updateProposalContract();
        if (this.config.deployer['config_proposal_contracts']) await this.configureProposalContract();

        if (this.config.deployer['activate_proposal_contracts']) await this.activateProposalContract();
        if (this.config.deployer['participate_proposal_contracts']) await this.participateProposalContract();
        if (this.config.deployer['withdraw_participate_proposal_contracts']) await this.participationWithdrawProposalContract();
        if (this.config.deployer['vote_proposal_contracts']) await this.voteProposalContract();

        process.exit();
    }
}

module.exports = GoraDaoDeployer