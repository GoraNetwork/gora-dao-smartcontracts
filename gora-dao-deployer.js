const fetch = require('node-fetch');
const sha512_256 = require('js-sha512').sha512_256;
const base32 = require('hi-base32');
const fs = require('fs').promises;
const path = require('path');
const { on } = require('events');
const configBase = require('./config_example.json');
const crypto = require('crypto');
const { send } = require('process');
const msgpack = require('@msgpack/msgpack');
require('dotenv').config();
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// GoraDAO deployer Class
const GoraDaoDeployer = class {
    // Class constructor
    constructor(props, isInteractive) {
        // Configurations instance
        this.config = props.config
        // Logger instance with Winston-Chalk logger module
        this.logger = props.logger
        // AlgoSDK instance
        this.algosdk = props.algosdk

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
        // GoraDAO Main Asset ID
        this.goraDaoAsset = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.dao_testnet_asa_id : props.config.gora_dao.dao_asa_id


        this.proposalApplicationId = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_proposal_id : props.config.gora_dao.asc_proposal_id // GoraDAO Proposal application ID
        this.proposalApplicationAddress = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_proposal_address : props.config.gora_dao.asc_proposal_address // GoraDAO Proposal application Address
        this.proposalAsset = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.proposal_testnet_asa_id : props.config.gora_dao.proposal_asa_id // GoraDAO Proposal Asset ID

        // GoraDao Main contracts
        this.goraDaoMainContractAbi = props.daoContract
        this.daoApprovalProgData = props.daoApprovalProgData
        this.daoClearProgData = props.daoClearProgData

        // GoraDao Proposal contracts ABI and TEAL source
        this.proposalContract = props.proposalContract
        this.proposalApprovalProgData = props.proposalApprovalProgData
        this.proposalClearProgData = props.proposalClearProgData

        // GoraDao Vesting contracts ABI and TEAL source
        this.vestingContract = props.vestingContract
        this.vestingApprovalProgData = props.vestingApprovalProgData
        this.vestingClearProgData = props.vestingClearProgData

        // GoraDao Staking contracts

        this.goraDaoStakingApplicationId = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_staking_id : props.config.gora_dao.asc_staking_id // GoraDAO Staking application ID
        this.stakingApplicationAddress = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.asc_testnet_staking_address : props.config.gora_dao.asc_staking_address // GoraDAO Staking application Address
        this.stakingAsset = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.staking_testnet_asa_id : props.config.gora_dao.staking_asa_id // GoraDAO Staking Asset ID

        // GoraDao Staking contracts ABI and TEAL source
        this.goraDaoStakingContractAbi = props.goraDaoStakingContractAbi
        this.stakingApprovalProgData = props.stakingApprovalProgData
        this.stakingClearProgData = props.stakingClearProgData

        this.proxyStakingMainAppId = props.config.gora_dao.network === 'testnet' ? props.config.deployer.staking_testnet.proxy_staking_main_app_id : props.config.deployer.staking_mainnet.proxy_staking_main_app_id
        this.proxyStakingVestingAppId = props.config.gora_dao.network === 'testnet' ? props.config.deployer.staking_testnet.proxy_staking_vesting_app_id : props.config.deployer.staking_mainnet.proxy_staking_vesting_app_id

        this.stakingParams = props.config.gora_dao.network === 'testnet' ? props.config.deployer.staking_testnet.staking_params : props.config.deployer.staking_mainnet.staking_params
        this.goraToken = props.config.gora_dao.network === 'testnet' ? props.config.gora_dao.gora_testnet_token_id : props.config.gora_dao.gora_token_id
        this.isGoraTokenEnforced = props.config.gora_dao.enforce_gora_token


        // Global Variables attached to class instance object

        this.goraDaoAdminAccount = null
        this.goraDaoProposalAdminAccount = null
        this.goraDaoStakingAdminAccount = null
        this.goraDaoUserAccount1 = null
        this.goraDaoUserAccount2 = null
        this.goraDaoUserAccount3 = null
        this.goraDaoUserAccount4 = null
        this.goraDaoUserAccount5 = null
        this.accountBalance = null
        this.assetsHeld = null
        this.assetsCreated = null
        this.appsCreated = null
        this.assetsHeldBalance = null
        this.assetsCreatedBalance = null
        this.trxPayment = null
        this.trxTransfer = null

    }
    // Running GoraDAO deployer
    async runDeployer(isInteractive) {
        // Running deployer account instantiation
        await this.deployerAccount()
        if (!isInteractive) {
            if (this.config.deployer['deployer_report']) await this.deployerReport();
            // Running deployer DAO main contract operations
            if (this.config.deployer['create_dao_contracts']) await this.deployMainContract();
            if (this.config.deployer['update_dao_contracts']) await this.updateMainContract();
            if (this.config.deployer['create_dao_asset']) await this.createDaoAsset();
            if (this.config.deployer['create_dao_proposal_asset']) await this.createDaoProposalAsset();
            if (this.config.deployer['create_dao_staking_asset']) await this.createDaoStakingAsset();
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

            if (this.config.deployer['activate_proposal_contracts']) await this.activateProposalContract();
            if (this.config.deployer['participate_proposal_contracts']) await this.participateProposalContract();
            if (this.config.deployer['withdraw_participate_proposal_contracts']) await this.participationWithdrawProposalContract();
            if (this.config.deployer['vote_proposal_contracts']) await this.voteProposalContract();

            // Running deployer DAO Staking contract operations
            if (this.config.deployer['write_staking_source_box']) await this.writeStakingContractSourceBox();
            if (this.config.deployer['create_staking_contracts']) await this.createStakingContract();
            if (this.config.deployer['update_staking_contracts']) await this.updateStakingContract();
            if (this.config.deployer['config_staking_contracts']) await this.configureStakingContract();

            if (this.config.deployer['activate_staking_contracts']) await this.activateStakingContract();
            // if (this.config.deployer['participate_staking_contracts']) await this.participateStakingContract();
            // if (this.config.deployer['withdraw_participate_staking_contracts']) await this.participationWithdrawStakingContract();
            if (this.config.deployer['stake_staking_contracts']) await this.stakeStakingContract();
            if (this.config.deployer['unstake_staking_contracts']) await this.stakeStakingContract();
            if (this.config.deployer['optin_proxy_staking_contracts']) await this.optinProxyStakingContract();
            if (this.config.deployer['stake_proxy_staking_contracts']) await this.stakeProxyStakingContract();
            if (this.config.deployer['unstake_proxy_staking_contracts']) await this.unstakeProxyStakingContract();
            process.exit();
        }
    }

    ////////////////////////////////////////////////////////////////////////
    //////////// GoraDAO Tooling Operations ////////////
    extractUint40(uint8Array, offset = 0) {
        // Ensure that the Uint8Array has enough bytes to extract a 5-byte number (40 bits)
        if (uint8Array.length < offset + 5) {
            throw new Error("Uint8Array does not have enough bytes to extract a 5-byte number.");
        }

        // Extract the 5 bytes from the Uint8Array starting from the offset
        const uint40 = BigInt.asUintN(40,
            (BigInt(uint8Array[offset + 0]) << 32n) |
            (BigInt(uint8Array[offset + 1]) << 24n) |
            (BigInt(uint8Array[offset + 2]) << 16n) |
            (BigInt(uint8Array[offset + 3]) << 8n) |
            BigInt(uint8Array[offset + 4])
        );

        // Convert to a regular Number if within safe range
        const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
        if (uint40 <= MAX_SAFE_INTEGER) {
            return Number(uint40); // Return as a regular number
        } else {
            throw new Error("Value exceeds safe range for JavaScript Number.");
        }
    }
    extractUint64(uint8Array, offset = 0) {
        // Ensure that the Uint8Array has enough bytes to extract a uint64
        if (uint8Array.length < offset + 8) {
            throw new Error("Uint8Array does not have enough bytes to extract a uint64.");
        }

        // Extract the 8 bytes from the Uint8Array starting from the offset
        const uint64 = BigInt.asUintN(64,
            (BigInt(uint8Array[offset + 0]) << 56n) |
            (BigInt(uint8Array[offset + 1]) << 48n) |
            (BigInt(uint8Array[offset + 2]) << 40n) |
            (BigInt(uint8Array[offset + 3]) << 32n) |
            (BigInt(uint8Array[offset + 4]) << 24n) |
            (BigInt(uint8Array[offset + 5]) << 16n) |
            (BigInt(uint8Array[offset + 6]) << 8n) |
            BigInt(uint8Array[offset + 7])
        );

        return uint64;
    }
    extractBoolean(uint8Array, offset = 0) {
        // Ensure that the Uint8Array has enough bytes to extract a boolean (1 byte)
        if (uint8Array.length < offset + 1) {
            throw new Error("Uint8Array does not have enough bytes to extract a boolean.");
        }

        // Extract the byte at the given offset and determine the boolean value
        const byteValue = uint8Array[offset];
        return byteValue !== 0; // true if non-zero, false if zero
    }
    // This method saves the configuration object to a JSON file
    async saveConfigToFile(config) {
        try {
            // Convert the config object to a JSON string with indentation for readability
            const configJson = JSON.stringify(config, null, 2);

            // Use fs.promises.writeFile to save the JSON string to config.json
            await fs.writeFile('config.json', configJson, 'utf8');
            // delete require.cache[require.resolve('./config.json')];
            // const config = require('./config.json');

            console.log('Configuration saved to config.json successfully.');
        } catch (error) {
            console.error('Failed to save configuration to config.json:', error);
        }
    }
    // Loads existing mnemonics or creates new ones
    async loadOrCreateMnemonics() {
        // Define mnemonic keys and filenames
        const mnemonicKeys = [
            'GORADAO_MNEMONIC_0',
            'GORADAO_MNEMONIC_1',
            'GORADAO_MNEMONIC_2',
            'GORADAO_MNEMONIC_3',
            'GORADAO_MNEMONIC_4',
            'GORADAO_MNEMONIC_5',
            'GORADAO_MNEMONIC_6',
            'GORADAO_MNEMONIC_7',
        ];
        // const filenames = mnemonicKeys.map((key, index) => `gora_${key}.txt`);


        for (let i = 0; i < mnemonicKeys.length; i++) {
            try {
                // Attempt to read the mnemonic from file
                //this[mnemonicKeys[i]] = await fs.readFile(filenames[i], 'utf8');
                this[mnemonicKeys[i]] = process.env[mnemonicKeys[i]];
                this.logger.info(`${mnemonicKeys[i]} loaded successfully.`);
            } catch (error) {
                // If file does not exist, generate a new mnemonic and save it
                const { addr, sk } = this.algosdk.generateAccount();
                let mnemonic = this.algosdk.secretKeyToMnemonic(sk);
                await fs.writeFile(mnemonicKeys[i], mnemonic, 'utf8');

                const envFilePath = path.join(__dirname, '.env');
                const envFileContent = await fs.readFile(envFilePath, 'utf8');
                const updatedEnvFileContent = envFileContent.replace(new RegExp(`${mnemonicKeys[i]}=".*"`), `${mnemonicKeys[i]}="${mnemonic}"`);
                await fs.writeFile(envFilePath, updatedEnvFileContent, 'utf8');
                this[mnemonicKeys[i]] = mnemonic;
                this.logger.info(`${mnemonicKeys[i]} created and saved.`);
            }
        }
    }
    // Logs the GoraDAO accounts with URL links to faucet to dispense ALGOs
    testAccountDispense() {
        console.log("")
        this.logger.info('Please click on each link to dispense ALGOs to the associated account:')
        this.logger.info('--------------------------GoraDAO DAO Creator Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoAdminAccount.addr);
        this.logger.info('--------------------------GoraDAO Proposal Creator Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoProposalAdminAccount.addr);
        this.logger.info('--------------------------GoraDAO Staking Creator Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoStakingAdminAccount.addr);

        this.logger.info('--------------------------GoraDAO Proposal/Staking User 1 Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoUserAccount1.addr);
        this.logger.info('--------------------------GoraDAO Proposal/Staking User 2 Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoUserAccount2.addr);
        this.logger.info('--------------------------GoraDAO Proposal/Staking User 3 Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoUserAccount3.addr);
        this.logger.info('--------------------------GoraDAO Proposal/Staking User 4 Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoUserAccount4.addr);
        this.logger.info('--------------------------GoraDAO Proposal/Staking User 5 Account DISPENSE-------------------------------------')
        this.logger.info(this.config.gora_dao['algo_dispenser'] + this.goraDaoUserAccount5.addr);
    }
    // This function backs up the config json file and resets it
    async resetConfigFile() {
        try {
            // Convert the config object to a JSON string with indentation for readability
            const configJson = JSON.stringify(this.config, null, 2);
            // Use fs.promises.writeFile to save the JSON string to config.json
            await fs.writeFile('config_backup.json', configJson, 'utf8');
            console.log('Configuration backed up to config_backup.json successfully.');
            await this.saveConfigToFile(configBase);
            console.log('Configuration in config.json has been reset successfully.');
        } catch (error) {
            console.error('Failed to save configuration back up to config_backup.json:', error);
        }
    }
    // Imports the accounts from Mnemonics
    importAccounts(mnemonicKey) {
        if (!this[mnemonicKey]) {
            this.logger.error(`The ${mnemonicKey} does not exist.`);
            const acc = this.algosdk.generateAccount();
            this.logger.info("Account Address = %s", acc.addr);
            return { acc, accRekey: null };
        } else {
            const acc = this.algosdk.mnemonicToSecretKey(this[mnemonicKey]);
            let addr = acc.addr;
            this.logger.info("Account Address = %s", addr);
            let acc_decoded = this.algosdk.decodeAddress(addr);
            //this.logger.info("Account Address Decoded Public Key = %s", acc_decoded.publicKey.toString());
            //this.logger.info("Account Address Decoded Checksum = %s", acc_decoded.checksum.toString());
            //let acc_encoded = this.algosdk.encodeAddress(acc_decoded.publicKey);
            // this.logger.info("Account Address Encoded = %s", acc_encoded);
            this.logger.warn(this.config.gora_dao['algo_dispenser'] + addr);
            return { acc, accRekey: null };
        }

    }
    // Gets the contract method instance for a given method
    getMethodByName(name, contract) {
        const m = contract.methods.find((mt) => { return mt.name == name })
        if (m === undefined)
            throw Error("Method undefined: " + name)
        return m
    }
    // Gets the balance information for GoraDAO account address
    async fetchAlgoWalletInfo() {
        if (this.algosdk.isValidAddress(this.goraDaoAdminAccount.addr)) {
            const url = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/accounts/${this.goraDaoAdminAccount.addr}`;
            const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['indexer_testnet_remote_server'] : this.config.gora_dao['indexer_remote_server']}/v2/accounts/${this.goraDaoAdminAccount.addr}/transactions?limit=10`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let data = await res.json()
            if (data) {
                if (data.account) {
                    data = data.account;
                }
                if (String(data.address) === String(this.goraDaoAdminAccount.addr)) {
                    this.accountBalance = data.amount
                    this.assetsHeld = data.assets
                    this.assetsCreated = data["created-assets"]
                    this.appsCreated = data["created-apps"]
                    this.assetsHeldBalance = !!this.assetsHeld ? this.assetsHeld.length : 0
                    this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0
                    if (this.appsCreated) this.appsCreatedBalance = this.appsCreated.length


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
        if (this.algosdk.isValidAddress(this.goraDaoProposalAdminAccount)) {
            const url = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/accounts/${this.goraDaoProposalAdminAccount.addr}`;
            const urlTrx = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['indexer_testnet_remote_server'] : this.config.gora_dao['indexer_remote_server']}/v2/accounts/${this.goraDaoProposalAdminAccount.addr}/transactions?limit=10`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let data = await res.json()
            if (data) {
                if (data.account) {
                    if (String(data.account.address) === String(this.goraDaoProposalAdminAccount.addr)) {
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
    // This is the method to get transaction logs from indexer endpoints
    async printTransactionLogsFromIndexer(txID, confirmedRound) {
        try {
            if (this.algosdk.isValidAddress(this.goraDaoAdminAccount.addr)) {

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
        if (this.algosdk.isValidAddress(this.goraDaoAdminAccount.addr)) {

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
                            if (item && item.txn && item.dt && item.dt.lg && item.txn.snd === this.goraDaoAdminAccount.addr) {

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
        if (this.algosdk.isValidAddress(this.goraDaoAdminAccount.addr)) {
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
    base64UrlEncode(base64String) {
        return base64String
            .replace(/\+/g, '-')  // Replace + with -
            .replace(/\//g, '_')  // Replace / with _
            .replace(/=+$/, '');  // Remove trailing =
    }
    async getSubscriptionStatus(account) {
        let userAccountAddress = account.addr;
        if (this.algosdk.isValidAddress(userAccountAddress)) {
            let appId = this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['asc_testnet_main_id'] : this.config.gora_dao['asc_main_id'];
            let decodedAccount = this.algosdk.decodeAddress(userAccountAddress);
            let base64BoxName = Buffer.from(decodedAccount.publicKey).toString('base64');
            let encodedBase64boxNameRef = encodeURIComponent('b64:' + base64BoxName);
            const urlApp = `${this.config.gora_dao.network === 'testnet' ? "https://testnet-api.algonode.cloud" : "https://mainnet-api.algonode.cloud"}/v2/applications/${appId}/box?name=${encodedBase64boxNameRef}`;
            let resApp = await fetch(urlApp, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            let boxData = await resApp.json()
            if (boxData && boxData.name) {
                this.logger.info(`Account address ${userAccountAddress} has subscription status: ${boxData.name.toString()}`)
                return true
            } else {
                this.logger.error(`Account address ${userAccountAddress} has no subscription status`)
                return false
            }
        }
    }
    async getCreatedProposals() {

        let appId = this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['asc_testnet_main_id'] : this.config.gora_dao['asc_main_id'];
        let appAddress = this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['asc_testnet_main_address'] : this.config.gora_dao['asc_main_address'];

        //const urlApp = `${this.config.gora_dao.network === 'testnet' ? "https://testnet-api.algonode.cloud" : "https://mainnet-api.algonode.cloud"}/v2/applications/${appId}/`;
        const urlAppAccount = `${this.config.gora_dao.network === 'testnet' ? "https://testnet-api.algonode.cloud" : "https://mainnet-api.algonode.cloud"}/v2/accounts/${appAddress}/`;
        let resAppAccount = await fetch(urlAppAccount, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        let appAccountData = await resAppAccount.json()
        if (appAccountData && appAccountData['total-created-apps']) {
            this.logger.info(`GoraDAO has ${appAccountData['total-created-apps']} proposals deployed!`)
            let daoProposals = appAccountData['created-apps'].map((app) => {
                return {
                    id: app.id,
                    address: this.algosdk.getApplicationAddress(app.id),
                    creator: app.creator,
                    fields: app['global-state'].map((param) => {
                        if (param?.value?.type === 1) {
                            return {
                                key: Buffer.from(param.key, 'base64').toString(),
                                value: Buffer.from(param.value.bytes, 'base64').toString()
                            }
                        } else if (param?.value?.type === 2) {
                            return {
                                key: Buffer.from(param.key, 'base64').toString(),
                                value: param.value.uint
                            }
                        }

                    })
                }
            })
            return daoProposals
        } else {
            this.logger.error(`Failed to retrieve proposals from GoraDAO`)
            return null
        }
    }
    async printStakingUserBox() {
        if (this.algosdk.isValidAddress(this.goraDaoStakingAdminAccount.addr)) {
            let delegatorAddress = this.goraDaoUserAccount2.addr;
            let delegatorPublicKey = this.algosdk.decodeAddress(delegatorAddress);

            let v2AppIdArray = this.algosdk.encodeUint64(this.stakingParams['staking_proxy_app_id'])
            let v2AppIdArrayLength = v2AppIdArray.length
            let stakeUserPublicKeyLength = delegatorPublicKey.publicKey.length
            let boxNameRef = new Uint8Array(v2AppIdArrayLength + stakeUserPublicKeyLength)
            boxNameRef.set(delegatorPublicKey.publicKey, 0)
            boxNameRef.set(v2AppIdArray, stakeUserPublicKeyLength)
            const base64boxNameRef = Buffer.from(boxNameRef).toString('base64');
            const encodedBase64boxNameRef = encodeURIComponent(base64boxNameRef)
            const urlApp = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/applications/${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['asc_testnet_staking_id'] : this.config.gora_dao['asc_staking_id']}/box?name=b64:${encodedBase64boxNameRef}`;

            let resApp = await fetch(urlApp, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let boxData = await resApp.json()
            if (boxData) {
                this.logger.info(boxData.name)
                let valueDecoded = new Uint8Array(Buffer.from(boxData.value, "base64"));
                let val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                console.log(val0)
                let val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                console.log(val1)
                let val2 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 16) : 0
                console.log(val2)
                let val3 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 24) : 0
                console.log(val3)

                this.logger.info(boxData.round)

            }


        }
    }
    async printStakingNFTBox(asaId) {
        if (this.algosdk.isValidAddress(this.goraDaoStakingAdminAccount.addr) && Number(asaId) > 1000) {
            const urlApp = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/applications/${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['asc_testnet_staking_id'] : this.config.gora_dao['asc_staking_id']}/box?name=int:${asaId}`;

            let resApp = await fetch(urlApp, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let boxData = await resApp.json()
            if (boxData && !(boxData.error)) {
                this.logger.info(boxData.name)
                let valueDecoded = new Uint8Array(Buffer.from(boxData.value, "base64"));
                let val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                console.log(val0)
                let val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                console.log(val1)
                let val2 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 16) : 0
                console.log(val2)
                let val3 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 24) : 0
                console.log(val3)


                this.logger.info(boxData.round)

            }


        }
    }
    async printAppLocalState(account) {
        if (this.config['gora_dao']['asc_staking_address']) {
            const urlApp = `${this.config.gora_dao.network === 'testnet' ? this.config.gora_dao['algod_testnet_remote_server'] : this.config.gora_dao['algod_remote_server']}/v2/accounts/${account}/applications/${this.stakingParams['staking_proxy_app_id']}`;

            let resApp = await fetch(urlApp, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            let dataApp = await resApp.json()
            if (dataApp) {
                if (dataApp["app-local-state"]) {
                    let gs = dataApp["app-local-state"];
                    let gsKeys = gs['key-value']
                    for (let i = 0; i < gsKeys.length; i++) {
                        let kv = gsKeys[i];



                        let gsValueDecoded = null;
                        let keyStr = Buffer.from(
                            kv.key,
                            "base64"
                        ).toString();
                        let val0, val1, val2, val3, val4, val5, val6 = 0
                        this.logger.info('Staking V2 Local State Key: %s', keyStr)
                        let valueDecoded = new Uint8Array(Buffer.from(kv.value.bytes, "base64"));
                        switch (keyStr) {
                            case 'lat':
                                val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                console.log(val0)
                                val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                                console.log(val1)
                                val2 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 16) : 0
                                console.log(val2)
                                val3 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 24) : 0
                                console.log(val3)
                                val4 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 32) : 0
                                console.log(val4)
                                val5 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 40) : 0
                                console.log(val5)
                                val6 = valueDecoded.length > 0 ? this.extractBoolean(valueDecoded, 48) : 0
                                console.log(val6)



                                break;
                            case 'lns':
                                val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                console.log(val0)
                                val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                                console.log(val1)
                                val2 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 16) : 0
                                console.log(val2)
                                val3 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 24) : 0
                                console.log(val3)

                                break;
                            case 'lt':
                                val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                console.log(val0)
                                break;
                            case 'vt':
                                val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                console.log(val0)
                                val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                                console.log(val1)

                                break;
                            case 'ls':
                                if (valueDecoded.length === 32) {
                                    val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                    console.log(val0)
                                    val1 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 8) : 0
                                    console.log(val1)
                                    val2 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 16) : 0
                                    console.log(val2)
                                    val3 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 24) : 0
                                    console.log(val3)
                                } else if (valueDecoded.length < 8) {
                                    val0 = valueDecoded.length > 0 ? this.extractUint40(valueDecoded, 0) : 0
                                    console.log(val0)

                                }


                                break;
                            case 'lut':
                                val0 = valueDecoded.length > 0 ? this.extractUint64(valueDecoded, 0) : 0
                                console.log(val0)
                                break;

                            default:
                                break;
                        }


                    }
                }
            }


        }
    }

    // Prints the created assets for a given account address
    async printCreatedAsset(assetid) {
        let accountInfo = await this.indexerClient.lookupAccountByID(this.goraDaoAdminAccount.addr).do();
        this.accountBalance = accountInfo.account.amount
        this.assetsCreated = accountInfo['account']["created-assets"]
        this.assetsCreatedBalance = !!this.assetsCreated ? this.assetsCreated.length : 0

        // this.logger.info('------------------------------')
        // this.logger.info("Printed Account Balance = %s", this.accountBalance);
        // this.logger.info('------------------------------')
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

                        this.logger.info("AssetID = %s", sAsset['index']);
                        this.logger.info('------------------------------')
                        this.logger.info("Asset params = %s", params);
                        this.logger.info('------------------------------')
                        break;
                    }
                } else {
                    let params = JSON.stringify(sAsset['params'], null, 2);

                    this.logger.info("Created AssetID = %s", sAsset['index']);
                    this.logger.info('------------------------------')
                    this.logger.info("Created Asset Info = %s", params);
                    this.logger.info('------------------------------')
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
                        this.logger.info('------------------------------')
                        break;
                    }
                } else {
                    let assetHoldings = JSON.stringify(sAsset, null, 2);

                    this.logger.info("Printed Held AssetID = %s", sAsset['asset-id']);
                    this.logger.info('------------------------------')
                    this.logger.info("Printed Held Asset Info = %s", assetHoldings);
                    this.logger.info('------------------------------')
                }
            }
        }
    }
    // Prints the general report on GoraDAO account
    async deployerReport() {
        try {
            this.logger.info("GoraDAO DAO Admin Account")
            await this.fetchAlgoWalletInfo();
        }
        catch (err) {
            this.logger.error(err);
        }
        try {

            await this.printCreatedAsset();
        }
        catch (err) {
            this.logger.error(err);
            this.logger.error("No GoraDAO created assets found")
        }
        try {

            await this.printAssetHolding(this.goraDaoAdminAccount.addr);
            this.logger.info("GoraDAO Proposal Admin Account")
            this.logger.info('------------------------------')
            await this.printAssetHolding(this.goraDaoProposalAdminAccount.addr);
            this.logger.info("GoraDAO Staking Admin Account")
            this.logger.info('------------------------------')
            await this.printAssetHolding(this.goraDaoStakingAdminAccount.addr);
        }
        catch (err) {
            this.logger.error(err);
            this.logger.error("No GoraDAO Proposal assets found")
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
            const signedTxn = txn.signTxn(this.goraDaoAdminAccount.sk);
            const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txId, 5)
            let ptx = await this.algodClient.pendingTransactionInformation(txId).do();
            const noteArrayFromTxn = ptx.txn.txn.note;
            const receivedNote = Buffer.from(noteArrayFromTxn).toString('utf8');
            this.logger.info("Note from confirmed GoraDAO Delete TXN: %s", receivedNote);
        }

    }
    // Gets the accounts from Mnemonics
    async deployerAccount() {
        try {

            await this.loadOrCreateMnemonics()
            const goraDaoAdminAccount = await this.importAccounts('GORADAO_MNEMONIC_0');
            this.goraDaoAdminAccount = goraDaoAdminAccount.acc


            const goraDaoProposalAdminAccount = await this.importAccounts('GORADAO_MNEMONIC_1');
            this.goraDaoProposalAdminAccount = goraDaoProposalAdminAccount.acc
            await this.getSubscriptionStatus(this.goraDaoProposalAdminAccount)
            const goraDaoUserAccount1 = await this.importAccounts('GORADAO_MNEMONIC_2');
            this.goraDaoUserAccount1 = goraDaoUserAccount1.acc

            const goraDaoUserAccount2 = await this.importAccounts('GORADAO_MNEMONIC_3');
            this.goraDaoUserAccount2 = goraDaoUserAccount2.acc

            const goraDaoUserAccount3 = await this.importAccounts('GORADAO_MNEMONIC_4');
            this.goraDaoUserAccount3 = goraDaoUserAccount3.acc

            const goraDaoUserAccount4 = await this.importAccounts('GORADAO_MNEMONIC_5');
            this.goraDaoUserAccount4 = goraDaoUserAccount4.acc

            const goraDaoUserAccount5 = await this.importAccounts('GORADAO_MNEMONIC_6');
            this.goraDaoUserAccount5 = goraDaoUserAccount5.acc

            const goraDaoStakingAdminAccount = await this.importAccounts('GORADAO_MNEMONIC_7');
            this.goraDaoStakingAdminAccount = goraDaoStakingAdminAccount.acc

        }
        catch (err) {
            this.logger.error(err);
        }
    }
    // This method is used to create a random integer between min and max integers (used for NFT value in NFT Staking)
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    ////////////////////////////////////////////////////////////////////////
    //////////// GoraDAO Tokens and Assets Operations ////////////

    // Sends GoraDAO Asset to the users
    async sendGoraDaoAssetTransaction(appOnly) {
        let addrFrom = this.goraDaoAdminAccount.addr;
        let addrToProposer = this.goraDaoProposalAdminAccount.addr;
        let addrToStaking = this.goraDaoStakingAdminAccount.addr;
        let appAddrTo = this.config.gora_dao.network === "testnet" ? this.config.gora_dao.asc_testnet_main_address : this.config.gora_dao.asc_main_address;
        let amount = 10;
        let params = await this.algodClient.getTransactionParams().do();
        if (!appOnly) {
            const txnOptinProposer = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrToProposer, // from
                addrToProposer, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.goraDaoAsset, // assetID
                params,
                undefined
            );
            const txnOptinStaking = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrToStaking, // from
                addrToStaking, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.goraDaoAsset, // assetID
                params,
                undefined
            );
            const txnSendToProposer = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFrom, // from
                addrToProposer, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.goraDaoAsset, // assetID
                params,
                undefined
            );
            const txnSendToStaking = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFrom, // from
                addrToStaking, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.goraDaoAsset, // assetID
                params,
                undefined
            );
        }
        const txnSendToApp = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrFrom, // from
            appAddrTo, // to 
            undefined, // closeRemainderTo
            undefined, // note
            amount, // amount 
            undefined,// Note
            this.goraDaoAsset, // assetID
            params,
            undefined
        );
        // Sign the transactions
        if (!appOnly) {
            const signedOptinProposerTxn = txnOptinProposer.signTxn(this.goraDaoProposalAdminAccount.sk);
            const signedSendToProposerTxn = txnSendToProposer.signTxn(this.goraDaoAdminAccount.sk);
            const signedOptinStakingTxn = txnOptinStaking.signTxn(this.goraDaoStakingAdminAccount.sk);
            const signedSendToStakingTxn = txnSendToStaking.signTxn(this.goraDaoAdminAccount.sk);
        }
        const signedSendToAppTxn = txnSendToApp.signTxn(this.goraDaoAdminAccount.sk);

        if (!appOnly) {
            // Send the transaction
            const signedOptinProposerTxnResponse = await await this.algodClient.sendRawTransaction(signedOptinProposerTxn).do();
            this.logger.info(`Transaction ID: ${signedOptinProposerTxnResponse.txId}`);

            // Wait for confirmation
            const confirmedSignedOptinProposerTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinProposerTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinProposerTxnResponse.txId} confirmed in round ${confirmedSignedOptinProposerTxnResponse['confirmed-round']}.`);
            this.logger.info('The proposer account has opted in to the GoraDAO Asset')


            // Send the transaction
            const signedOptinStakingTxnResponse = await await this.algodClient.sendRawTransaction(signedOptinStakingTxn).do();
            this.logger.info(`Transaction ID: ${signedOptinStakingTxnResponse.txId}`);

            // Wait for confirmation
            const confirmedSignedOptinStakingTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinStakingTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinStakingTxnResponse.txId} confirmed in round ${confirmedSignedOptinStakingTxnResponse['confirmed-round']}.`);
            this.logger.info('The staking account has opted in to the GoraDAO Asset');

            // Send the transaction
            const signedSendToProposerTxnResponse = await await this.algodClient.sendRawTransaction(signedSendToProposerTxn).do();
            this.logger.info(`Transaction ID: ${signedSendToProposerTxnResponse.txId}`);

            // Wait for confirmation
            const confirmedSignedSendToProposerTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToProposerTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedSendToProposerTxnResponse.txId} confirmed in round ${confirmedSignedSendToProposerTxn['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The proposer account successfully')

            // Send the transaction
            const signedSendToStakingTxnResponse = await await this.algodClient.sendRawTransaction(signedSendToStakingTxn).do();
            this.logger.info(`Transaction ID: ${signedSendToStakingTxnResponse.txId}`);

            // Wait for confirmation
            const confirmedSignedSendToStakingTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToStakingTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedSendToStakingTxnResponse.txId} confirmed in round ${confirmedSignedSendToStakingTxn['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The proposer account successfully')
        }


        // Send the transaction
        const signedSendToAppTxnResponse = await this.algodClient.sendRawTransaction(signedSendToAppTxn).do();
        this.logger.info(`Transaction ID: ${signedSendToAppTxnResponse.txId}`);

        // Wait for confirmation
        const confirmedSignedSendToAppTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToAppTxnResponse.txId, 5);
        this.logger.info(`Transaction ${signedSendToAppTxnResponse.txId} confirmed in round ${confirmedSignedSendToAppTxn['confirmed-round']}.`);
        this.logger.info('GoraDAO Asset has been sent to The GoraDAO App successfully');

        // Write config
        this.config['gora_dao']['dao_asa_distributed'] = true;
        await this.saveConfigToFile(this.config);
    }
    // Sends the Proposal Asset to the users
    async sendProposalAssetTransaction(appOnly) {
        let addrFrom = this.goraDaoAdminAccount.addr;
        let addrFromProposer = this.goraDaoProposalAdminAccount.addr;
        let addrTo1 = this.goraDaoUserAccount1.addr;
        let addrTo2 = this.goraDaoUserAccount2.addr;
        let addrTo3 = this.goraDaoUserAccount3.addr;
        let addrTo4 = this.goraDaoUserAccount4.addr;
        let addrTo5 = this.goraDaoUserAccount5.addr;
        let appAddrTo = this.proposalApplicationAddress;
        let amount = 5;
        let params = await this.algodClient.getTransactionParams().do();

        let txnPayUser1, txnPayUser2, txnPayUser3, txnPayUser4, txnPayUser5, txnOptinUser1, txnOptinUser2, txnOptinUser3, txnOptinUser4, txnOptinUser5, txnSendToUser1, txnSendToUser2, txnSendToUser3, txnSendToUser4, txnSendToUser5;



        if (!appOnly) {
            txnPayUser1 = this.algosdk.makePaymentTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo1, // to 
                500000, // amount 
                undefined,// closeRemainderTo
                undefined,// Note
                params,
                undefined,// rekey-to
            );
            txnPayUser2 = this.algosdk.makePaymentTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo2, // to 
                500000, // amount 
                undefined,// closeRemainderTo
                undefined,// Note
                params,
                undefined,// rekey-to
            );
            txnPayUser3 = this.algosdk.makePaymentTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo3, // to 
                500000, // amount 
                undefined,// closeRemainderTo
                undefined,// Note
                params,
                undefined,// rekey-to
            );
            txnPayUser4 = this.algosdk.makePaymentTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo4, // to 
                500000, // amount 
                undefined,// closeRemainderTo
                undefined,// Note
                params,
                undefined,// rekey-to
            );
            txnPayUser5 = this.algosdk.makePaymentTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo5, // to 
                500000, // amount 
                undefined,// closeRemainderTo
                undefined,// Note
                params,
                undefined,// rekey-to
            );
            // Optin transaction to user account
            txnOptinUser1 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrTo1, // from
                addrTo1, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnOptinUser2 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrTo2, // from
                addrTo2, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnOptinUser3 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrTo3, // from
                addrTo3, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnOptinUser4 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrTo4, // from
                addrTo4, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnOptinUser5 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrTo5, // from
                addrTo5, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            // Axfer transactions to 
            txnSendToUser1 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo1, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnSendToUser2 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo2, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnSendToUser3 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo3, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnSendToUser4 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo4, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
            txnSendToUser5 = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                addrFromProposer, // from
                addrTo5, // to 
                undefined, // closeRemainderTo
                undefined, // note
                amount, // amount 
                undefined,// Note
                this.proposalAsset, // assetID
                params,
                undefined
            );
        }
        // Axfer transaction to send proposal asset to proposal contract
        const txnSendToApp = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrFromProposer, // from
            appAddrTo, // to 
            undefined, // closeRemainderTo
            undefined, // note
            amount, // amount 
            undefined,// Note
            this.proposalAsset, // assetID
            params,
            undefined
        );
        let signedPayUserTxn1, signedPayUserTxn2, signedPayUserTxn3, signedPayUserTxn4, signedPayUserTxn5, signedOptinUserTxn1, signedOptinUserTxn2, signedOptinUserTxn3, signedOptinUserTxn4, signedOptinUserTxn5, signedSendToUserTxn1, signedSendToUserTxn2, signedSendToUserTxn3, signedSendToUserTxn4, signedSendToUserTxn5;
        // Sign the transaction
        if (!appOnly) {
            signedPayUserTxn1 = txnPayUser1.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedPayUserTxn2 = txnPayUser2.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedPayUserTxn3 = txnPayUser3.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedPayUserTxn4 = txnPayUser4.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedPayUserTxn5 = txnPayUser5.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedOptinUserTxn1 = txnOptinUser1.signTxn(this.goraDaoUserAccount1.sk);
            signedOptinUserTxn2 = txnOptinUser2.signTxn(this.goraDaoUserAccount2.sk);
            signedOptinUserTxn3 = txnOptinUser3.signTxn(this.goraDaoUserAccount3.sk);
            signedOptinUserTxn4 = txnOptinUser4.signTxn(this.goraDaoUserAccount4.sk);
            signedOptinUserTxn5 = txnOptinUser5.signTxn(this.goraDaoUserAccount5.sk);
            signedSendToUserTxn1 = txnSendToUser1.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedSendToUserTxn2 = txnSendToUser2.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedSendToUserTxn3 = txnSendToUser3.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedSendToUserTxn4 = txnSendToUser4.signTxn(this.goraDaoProposalAdminAccount.sk);
            signedSendToUserTxn5 = txnSendToUser5.signTxn(this.goraDaoProposalAdminAccount.sk);
        }
        const signedSendToAppTxn = txnSendToApp.signTxn(this.goraDaoProposalAdminAccount.sk);


        if (!appOnly) {
            const signedPayUserTxnResponse1 = await await this.algodClient.sendRawTransaction(signedPayUserTxn1).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse1.txId}`);
            const confirmedPayOptinUserTxnResponse1 = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse1.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse1.txId} confirmed in round ${confirmedPayOptinUserTxnResponse1['confirmed-round']}.`);
            this.logger.info('The Test User 1 account has been toped up!')
            const signedPayUserTxnResponse2 = await await this.algodClient.sendRawTransaction(signedPayUserTxn2).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse2.txId}`);
            const confirmedPayOptinUserTxnResponse2 = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse2.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse2.txId} confirmed in round ${confirmedPayOptinUserTxnResponse2['confirmed-round']}.`);
            this.logger.info('The Test User 2 account has been toped up!')
            const signedPayUserTxnResponse3 = await await this.algodClient.sendRawTransaction(signedPayUserTxn3).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse3.txId}`);
            const confirmedPayOptinUserTxnResponse3 = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse3.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse3.txId} confirmed in round ${confirmedPayOptinUserTxnResponse3['confirmed-round']}.`);
            this.logger.info('The Test User 3 account has been toped up!')
            const signedPayUserTxnResponse4 = await await this.algodClient.sendRawTransaction(signedPayUserTxn4).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse4.txId}`);
            const confirmedPayOptinUserTxnResponse4 = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse4.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse4.txId} confirmed in round ${confirmedPayOptinUserTxnResponse4['confirmed-round']}.`);
            this.logger.info('The Test User 4 account has been toped up!')
            const signedPayUserTxnResponse5 = await await this.algodClient.sendRawTransaction(signedPayUserTxn5).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse5.txId}`);
            const confirmedPayOptinUserTxnResponse5 = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse5.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse5.txId} confirmed in round ${confirmedPayOptinUserTxnResponse5['confirmed-round']}.`);
            this.logger.info('The Test User 5 account has been toped up!')


            const signedOptinUserTxnResponse1 = await await this.algodClient.sendRawTransaction(signedOptinUserTxn1).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse1.txId}`);
            const confirmedSignedOptinUserTxnResponse1 = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse1.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse1.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse1['confirmed-round']}.`);
            this.logger.info('The User 1 account has opted in to the Proposal Asset')
            const signedOptinUserTxnResponse2 = await await this.algodClient.sendRawTransaction(signedOptinUserTxn2).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse2.txId}`);
            const confirmedSignedOptinUserTxnResponse2 = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse2.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse2.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse2['confirmed-round']}.`);
            this.logger.info('The User 2 account has opted in to the Proposal Asset')
            const signedOptinUserTxnResponse3 = await await this.algodClient.sendRawTransaction(signedOptinUserTxn3).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse2.txId}`);
            const confirmedSignedOptinUserTxnResponse3 = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse3.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse3.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse3['confirmed-round']}.`);
            this.logger.info('The User 3 account has opted in to the Proposal Asset')
            const signedOptinUserTxnResponse4 = await await this.algodClient.sendRawTransaction(signedOptinUserTxn4).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse4.txId}`);
            const confirmedSignedOptinUserTxnResponse4 = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse4.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse4.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse4['confirmed-round']}.`);
            this.logger.info('The User 4 account has opted in to the Proposal Asset')
            const signedOptinUserTxnResponse5 = await await this.algodClient.sendRawTransaction(signedOptinUserTxn5).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse5.txId}`);
            const confirmedSignedOptinUserTxnResponse5 = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse5.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse5.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse5['confirmed-round']}.`);
            this.logger.info('The User 5 account has opted in to the Proposal Asset')


            const signedSendToUserTxnResponse1 = await await this.algodClient.sendRawTransaction(signedSendToUserTxn1).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse1.txId}`);
            const confirmedSignedSendToUserTxn1 = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse1.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse1.txId} confirmed in round ${confirmedSignedSendToUserTxn1['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 1 successfully')

            const signedSendToUserTxnResponse2 = await await this.algodClient.sendRawTransaction(signedSendToUserTxn2).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse2.txId}`);
            const confirmedSignedSendToUserTxn2 = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse2.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse2.txId} confirmed in round ${confirmedSignedSendToUserTxn2['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 2 successfully')

            const signedSendToUserTxnResponse3 = await await this.algodClient.sendRawTransaction(signedSendToUserTxn3).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse3.txId}`);
            const confirmedSignedSendToUserTxn3 = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse3.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse3.txId} confirmed in round ${confirmedSignedSendToUserTxn3['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 3 successfully')

            const signedSendToUserTxnResponse4 = await await this.algodClient.sendRawTransaction(signedSendToUserTxn4).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse4.txId}`);
            const confirmedSignedSendToUserTxn4 = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse4.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse4.txId} confirmed in round ${confirmedSignedSendToUserTxn4['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 4 successfully')

            const signedSendToUserTxnResponse5 = await await this.algodClient.sendRawTransaction(signedSendToUserTxn5).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse5.txId}`);
            const confirmedSignedSendToUserTxn5 = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse5.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse5.txId} confirmed in round ${confirmedSignedSendToUserTxn5['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 5 successfully')
        }


        const signedSendToAppTxnResponse = await await this.algodClient.sendRawTransaction(signedSendToAppTxn).do();
        this.logger.info(`Transaction ID: ${signedSendToAppTxnResponse.txId}`);
        // Wait for confirmation
        const confirmedSignedSendToAppTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToAppTxnResponse.txId, 5);
        this.logger.info(`Transaction ${signedSendToAppTxnResponse.txId} confirmed in round ${confirmedSignedSendToAppTxn['confirmed-round']}.`);
        this.logger.info('GoraDAO Asset has been sent to The GoraDAO App successfully')
        this.config['gora_dao']['proposal_asa_distributed'] = true;
        await this.saveConfigToFile(this.config)
    }
    // Sends the Staking Asset to the users
    async sendStakingAssetTransaction(appOnly, userIndex) {
        let addrFromStaking = this.goraDaoStakingAdminAccount.addr;
        let addrTo1 = this[`goraDaoUserAccount${userIndex}`].addr;

        let appAddrTo = this.stakingApplicationAddress;
        let amount = 5;
        let params = await this.algodClient.getTransactionParams().do();





        const txnPayUser = this.algosdk.makePaymentTxnWithSuggestedParams(
            addrFromStaking, // from
            addrTo1, // to 
            500000, // amount 
            undefined,// closeRemainderTo
            undefined,// Note
            params,
            undefined,// rekey-to
        );

        // Optin transaction to user account
        const txnOptinUser = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrTo1, // from
            addrTo1, // to 
            undefined, // closeRemainderTo
            undefined, // note
            0, // amount 
            undefined,// Note
            this.stakingAsset, // assetID
            params,
            undefined
        );

        // Axfer transactions to 
        const txnSendToUser = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrFromStaking, // from
            addrTo1, // to 
            undefined, // closeRemainderTo
            undefined, // note
            amount, // amount 
            undefined,// Note
            this.stakingAsset, // assetID
            params,
            undefined
        );


        // Axfer transaction to send staking asset to staking contract
        const txnSendToApp = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrFromStaking, // from
            appAddrTo, // to 
            undefined, // closeRemainderTo
            undefined, // note
            amount * 3 * 1000000000, // amount 
            undefined,// Note
            this.stakingAsset, // assetID
            params,
            undefined
        );

        // Sign the transaction
        const signedPayUserTxn = txnPayUser.signTxn(this.goraDaoStakingAdminAccount.sk);

        const signedOptinUserTxn = txnOptinUser.signTxn(this.goraDaoUserAccount1.sk);

        const signedSendToUserTxn = txnSendToUser.signTxn(this.goraDaoStakingAdminAccount.sk);

        const signedSendToAppTxn = txnSendToApp.signTxn(this.goraDaoStakingAdminAccount.sk);


        if (!appOnly) {
            const signedPayUserTxnResponse = await await this.algodClient.sendRawTransaction(signedPayUserTxn).do();
            this.logger.info(`Transaction ID: ${signedPayUserTxnResponse.txId}`);
            const confirmedPayUserTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedPayUserTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedPayUserTxnResponse.txId} confirmed in round ${confirmedPayUserTxnResponse['confirmed-round']}.`);
            this.logger.info('The Test User 1 account has been toped up!')



            const signedOptinUserTxnResponse = await await this.algodClient.sendRawTransaction(signedOptinUserTxn).do();
            this.logger.info(`Transaction ID: ${signedOptinUserTxnResponse.txId}`);
            const confirmedSignedOptinUserTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinUserTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinUserTxnResponse.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse['confirmed-round']}.`);
            this.logger.info('The User 1 account has opted in to the Staking Asset')



            const signedSendToUserTxnResponse = await await this.algodClient.sendRawTransaction(signedSendToUserTxn).do();
            this.logger.info(`Transaction ID: ${signedSendToUserTxnResponse.txId}`);
            const confirmedSignedSendToUserTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToUserTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedSendToUserTxnResponse.txId} confirmed in round ${confirmedSignedSendToUserTxn['confirmed-round']}.`);
            this.logger.info('GoraDAO Asset has been sent to The User 1 successfully')


        } else {
            const signedSendToAppTxnResponse = await await this.algodClient.sendRawTransaction(signedSendToAppTxn).do();
            this.logger.info(`Transaction ID: ${signedSendToAppTxnResponse.txId}`);
            // Wait for confirmation
            const confirmedSignedSendToAppTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToAppTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedSendToAppTxnResponse.txId} confirmed in round ${confirmedSignedSendToAppTxn['confirmed-round']}.`);
        }


        this.logger.info('GoraDAO Asset has been sent to The GoraDAO App successfully')
        this.config['gora_dao']['staking_asa_distributed'] = true;
        await this.saveConfigToFile(this.config)
    }
    async sendStakingNFTtoWalletAddress(walletAddress, nftId) {
        let addrFromStaking = this.goraDaoUserAccount2.addr;
        let amount = 1;
        let params = await this.algodClient.getTransactionParams().do();
        // Axfer transactions to 
        const txnSendToWallet = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
            addrFromStaking, // from
            walletAddress, // to 
            undefined, // closeRemainderTo
            undefined, // note
            amount, // amount 
            undefined,// Note
            nftId, // assetID
            params,
            undefined
        );
        // Sign the transaction
        const txnSendToWalletSigned = txnSendToWallet.signTxn(this.goraDaoUserAccount2.sk);
        const signedSendToWalletTxnResponse = await await this.algodClient.sendRawTransaction(txnSendToWalletSigned).do();
        this.logger.info(`Transaction ID: ${signedSendToWalletTxnResponse.txId}`);
        // Wait for confirmation
        const confirmedSignedSendToWalletTxn = await this.algosdk.waitForConfirmation(this.algodClient, signedSendToWalletTxnResponse.txId, 5);
        this.logger.info(`Transaction ${signedSendToWalletTxnResponse.txId} confirmed in round ${confirmedSignedSendToWalletTxn['confirmed-round']}.`);
        this.logger.info('GoraDAO Asset has been sent to The GoraDAO App successfully')
        let nfts = this.config['gora_dao'].network === 'mainnet' ? this.config['gora_dao']['deployer']['nft_staking_mainnet_assets'] : this.config['gora_dao']['deployer']['nft_staking_testnet_assets']
        for (let index = 0; index < nfts.length; index++) {
            if (nfts[index].asset == nftId) {
                nfts[index].sentTo = walletAddress;
            }
        }
        await this.saveConfigToFile(this.config)
    }
    // Send all ALGOs from the local accounts to the target account and delete the accounts mnemonic files
    async sendAllAlgosAndDeleteMnemonics() {
        // Define mnemonic files and their corresponding keys in this object
        const mnemonicFiles = [
            'GORADAO_MNEMONIC_0',
            'GORADAO_MNEMONIC_1',
            'GORADAO_MNEMONIC_2',
            'GORADAO_MNEMONIC_3',
            'GORADAO_MNEMONIC_4',
            'GORADAO_MNEMONIC_5',
            'GORADAO_MNEMONIC_6',
            'GORADAO_MNEMONIC_7'
        ];

        try {
            for (const mnemo of mnemonicFiles) {
                // const mnemonic = await fs.readFile(path.join(__dirname, file), 'utf8');
                const mnemonic = process.env[mnemo];
                const account = this.algosdk.mnemonicToSecretKey(mnemonic.trim());

                // Get suggested transaction parameters
                let params = await this.algodClient.getTransactionParams().do();

                // Create a transaction with the "closeRemainderTo" field set to the target account
                const txn = this.algosdk.makePaymentTxnWithSuggestedParams(
                    account.addr, // from
                    this.config.owner, // to (receiving a minimal amount, could be 0)
                    0, // amount (minimal amount, since we're closing)
                    this.config.owner, // closeRemainderTo
                    undefined, // note
                    params,
                    undefined// rekeyTo: This is where all funds will be transferred
                );

                // Sign the transaction
                const signedTxn = txn.signTxn(account.sk);

                // Send the transaction
                const { txId } = await await this.algodClient.sendRawTransaction(signedTxn).do();
                this.logger.info(`Transaction ID: ${txId}`);

                // Wait for confirmation
                const confirmedTxn = await this.algosdk.waitForConfirmation(this.algodClient, txId, 5);
                this.logger.info(`Transaction ${txId} confirmed in round ${confirmedTxn['confirmed-round']}.`);

                this.logger.info(`Successfully closed account ${account.addr} and transferred funds to ${this.config.owner}.`);

                // Delete mnemonic file after successfully closing the account and transferring funds
                await fs.unlink(path.join(__dirname, file));
                this.logger.info(`Deleted mnemonic file: ${file}`);
            }
        } catch (error) {
            this.logger.error('Failed to send ALGOs and delete mnemonics:', error);
        }
    }
    // Create GoraDAO Asset
    async createDaoAsset() {
        let assetId = 0
        if (!this.isGoraTokenEnforced) {
            let params = await this.algodClient.getTransactionParams().do();
            const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
                assetMetadataHash: new Uint8Array(32),
                assetName: 'GoraDAO TEST ASSET',
                assetURL: 'https://gora.io',
                clawback: this.goraDaoAdminAccount.addr,
                freeze: this.goraDaoAdminAccount.addr,
                decimals: 0,
                defaultFrozen: false,
                from: this.goraDaoAdminAccount.addr,
                manager: this.goraDaoAdminAccount.addr,
                note: new Uint8Array(Buffer.from('GoraDAO TEST Asset')),
                reserve: this.goraDaoAdminAccount.addr,
                suggestedParams: { ...params, fee: 1000, flatFee: true, },
                total: 1000000,
                unitName: 'GDT',

            })
            this.logger.info('------------------------------')
            this.logger.info("GoraDAO Asset Creation...");
            let txnId = atxn.txID().toString();
            let signedTxn = await atxn.signTxn(this.goraDaoAdminAccount.sk);
            await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

            let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
            assetId = transactionResponse['asset-index'];
            this.logger.info(`GoraDAO created TEST Asset ID: ${assetId}`);

        } else if (this.isGoraTokenEnforced && !!this.goraToken) {
            assetId = this.goraToken;
            let params = await this.algodClient.getTransactionParams().do();
            const txnOptinAdminAccount = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                this.goraDaoAdminAccount.addr, // from
                this.goraDaoAdminAccount.addr, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.goraToken, // assetID
                params,
                undefined
            );


            const signedTxnOptinAdminAccount = txnOptinAdminAccount.signTxn(this.goraDaoAdminAccount.sk);
            const signedOptinAdminAccountTxnResponse = await await this.algodClient.sendRawTransaction(signedTxnOptinAdminAccount).do();
            this.logger.info(`Transaction ID: ${signedOptinAdminAccountTxnResponse.txId}`);
            const confirmedSignedOptinUserTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinAdminAccountTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinAdminAccountTxnResponse.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse['confirmed-round']}.`);
            this.logger.info('By config enforcement, The Admin account has explicitly opted in to the Gora Token')
            this.logger.info(`GoraDAO Asset has been explicitly set to Gora Token ID (By config): ${assetId}`);
        }
        this.config['gora_dao']['dao_asa_id'] = assetId;
        this.goraDaoAsset = assetId;
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Asset ID: ${assetId} written to config file!`);

    }

    ////////////////////////////////////////////////////////////////////////
    //////////// GoraDAO Main Contract Operations ////////////

    // Deploying GoraDAO Main Contract
    async deployMainContract() {
        let addr = this.goraDaoAdminAccount.addr;
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
            foreignAssets: [this.goraDaoAsset],
            from: addr,
            suggestedParams: params,
            onComplete,
            approvalProgram: compiledResultUint8,
            clearProgram: compiledClearResultUint8,
            numLocalInts: localInts,
            numLocalByteSlices: localBytes,
            numGlobalInts: globalInts,
            numGlobalByteSlices: globalBytes,
            extraPages: 1
        });
        let appTxnId = appTxn.txID().toString();

        this.logger.info('------------------------------')
        this.logger.info("GoraNetwork Main Application Creation TXId =  %s", appTxnId);
        let signedAppTxn = appTxn.signTxn(this.goraDaoAdminAccount.sk);

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
        let signedPayTxn = ptxn.signTxn(this.goraDaoAdminAccount.sk);

        await this.algodClient.sendRawTransaction(signedPayTxn).do();
        this.logger.info("GoraNetwork Main Application Address: %s funded!", this.goraDaoMainApplicationAddress);
        this.logger.info('------------------------------')

        if (this.config['gora_dao']['network'] == 'testnet') {
            this.config['gora_dao']['asc_testnet_main_id'] = appId;
            this.config['gora_dao']['asc_testnet_main_address'] = this.goraDaoMainApplicationAddress;

        } else {
            this.config['gora_dao']['asc_main_id'] = appId;
            this.config['gora_dao']['asc_main_address'] = this.goraDaoMainApplicationAddress;
        }
        this.config['gora_dao']['dao_dao_deployed'] = true;
        this.goraDaoMainApplicationId = appId
        this.goraDaoMainApplicationAddress = this.algosdk.getApplicationAddress(Number(appId));
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Main Application ID: ${appId} written to config file!`);
    }
    // Updating GoraDAO Main Contract
    async updateMainContract() {
        let addr = this.goraDaoAdminAccount.addr;
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
        let signedAppTxn = appTxn.signTxn(this.goraDaoAdminAccount.sk);
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
    // Configure GoraDAO main contract
    async configMainContract() {
        let addr = this.goraDaoAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let application = Number(this.goraDaoMainApplicationId)
        const contract = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoAdminAccount)
        let methodDaoConfig = this.getMethodByName("config_dao", contract)
        const commonParamsSetup = {
            appID: application,
            appAccounts: [addr],
            appForeignAssets: [Number(this.goraDaoAsset)],
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
            amount: 1000000,
            fee: params.minFee,
            ...params
        })

        const tws0 = { txn: ptxn, signer: signer }
        //(pay,asset,account)string
        const args = [
            //1 pay
            tws0,
            Number(this.goraDaoAsset),
            //2 proposal_fee_token
            1,
            //3 proposal_fee_algo
            10000,
            //4 min_subscription_algo
            100000,
            //5 min_subscription_token
            2,

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
    // Subscribe to GoraDAO main contract
    async subscribeDaoContract(type) {
        let account = type === 'proposal' ? this.goraDaoProposalAdminAccount : this.goraDaoStakingAdminAccount

        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(account)

        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)

        let memberPublicKey = this.algosdk.decodeAddress(account.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            appAccounts: [account.addr],
            appForeignAssets: [Number(this.goraDaoAsset)],
            sender: account.addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("subscribe_dao", contract)

        const ptxn = new this.algosdk.Transaction({
            from: account.addr,
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
                account.addr,// member account 
                account.addr,// member account 
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
            this.config['gora_dao']['subscribed_to_dao'] = true;
            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO Main Application ID: ${this.goraDaoMainApplicationId} written to config file!`);

        }
    }
    // Unsubscribe from GoraDAO main contract
    async unsubscribeDaoContract(type = 'proposal') {
        let account = type === 'proposal' ? this.goraDaoProposalAdminAccount : this.goraDaoStakingAdminAccount
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(account)

        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)

        let memberPublicKey = this.algosdk.decodeAddress(account.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: account.addr,
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
                account.addr,// member account 
                account.addr,// member account 
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
            this.config['gora_dao']['subscribed_to_dao'] = false;
            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO Main Application ID: ${this.goraDaoMainApplicationId} written to config file!`);

        }
    }
    // Create GoraDAO Proposal Asset
    async createDaoProposalAsset() {
        let assetId = 0
        if (!this.isGoraTokenEnforced) {
            let params = await this.algodClient.getTransactionParams().do();
            const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
                assetMetadataHash: new Uint8Array(32),
                assetName: 'GoraDAO Proposal TEST ASSET',
                assetURL: 'https://gora.io',
                clawback: this.goraDaoAdminAccount.addr,
                freeze: this.goraDaoAdminAccount.addr,
                decimals: 0,
                defaultFrozen: false,
                from: this.goraDaoProposalAdminAccount.addr,
                manager: this.goraDaoProposalAdminAccount.addr,
                note: new Uint8Array(Buffer.from('GoraDAO Proposal TEST Asset')),
                reserve: this.goraDaoProposalAdminAccount.addr,
                suggestedParams: { ...params, fee: 1000, flatFee: true, },
                total: 1000000,
                unitName: 'GDPT',

            })
            this.logger.info('------------------------------')
            this.logger.info("GoraDAO Proposal Asset Creation...");
            let txnId = atxn.txID().toString();
            let signedTxn = await atxn.signTxn(this.goraDaoProposalAdminAccount.sk);
            await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

            let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
            assetId = transactionResponse['asset-index'];
            this.logger.info(`GoraDAO Proposal TEST created Asset ID: ${assetId}`);
        } else if (this.isGoraTokenEnforced && !!this.goraToken) {
            assetId = this.goraToken;
            let params = await this.algodClient.getTransactionParams().do();
            const txnOptinProposalAccount = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                this.goraDaoProposalAdminAccount.addr, // from
                this.goraDaoProposalAdminAccount.addr, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.goraToken, // assetID
                params,
                undefined
            );

            const txnSendToProposalAccount = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                this.goraDaoAdminAccount.addr, // from
                this.goraDaoProposalAdminAccount.addr, // to 
                undefined, // closeRemainderTo
                undefined, // note
                5, // amount 
                undefined,// Note
                this.goraToken, // assetID
                params,
                undefined
            );

            const signedTxnOptinProposalAccount = txnOptinProposalAccount.signTxn(this.goraDaoProposalAdminAccount.sk);
            const signedOptinProposalAccountTxnResponse = await await this.algodClient.sendRawTransaction(signedTxnOptinProposalAccount).do();
            this.logger.info(`Transaction ID: ${signedOptinProposalAccountTxnResponse.txId}`);
            const confirmedSignedOptinUserTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinProposalAccountTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinProposalAccountTxnResponse.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse['confirmed-round']}.`);
            this.logger.info('By config enforcement, The Proposal account has explicitly opted in to the Gora Token')


            const signedTxnSendToProposalAccount = txnSendToProposalAccount.signTxn(this.goraDaoAdminAccount.sk);
            const signedTxnSendToProposalAccountResponse = await await this.algodClient.sendRawTransaction(signedTxnSendToProposalAccount).do();
            this.logger.info(`Transaction ID: ${signedTxnSendToProposalAccountResponse.txId}`);
            const confirmedSignedTxnSendToProposalAccountResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedTxnSendToProposalAccountResponse.txId, 5);
            this.logger.info(`Transaction ${signedTxnSendToProposalAccountResponse.txId} confirmed in round ${confirmedSignedTxnSendToProposalAccountResponse['confirmed-round']}.`);
            this.logger.info('By config enforcement Gora  Token has been sent to Proposal creator account successfully')
            this.logger.info(`GoraDAO Proposal Asset has explicitly been set to Gora Token (by config values): ${this.goraToken}`);
        }




        this.config['gora_dao']['proposal_asa_id'] = assetId;
        this.proposalAsset = assetId
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Proposal Asset ID: ${assetId} written to config file!`);

    }
    // Create GoraDAO Staking Asset
    async createDaoStakingAsset() {
        let assetId = 0
        if (!this.isGoraTokenEnforced) {
            let params = await this.algodClient.getTransactionParams().do();
            const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
                assetMetadataHash: new Uint8Array(32),
                assetName: 'GoraDAO Staking TEST ASSET',
                assetURL: 'https://gora.io',
                clawback: this.goraDaoAdminAccount.addr,
                freeze: this.goraDaoAdminAccount.addr,
                decimals: 0,
                defaultFrozen: false,
                from: this.goraDaoStakingAdminAccount.addr,
                manager: this.goraDaoStakingAdminAccount.addr,
                note: new Uint8Array(Buffer.from('GoraDAO Staking TEST Asset')),
                reserve: this.goraDaoStakingAdminAccount.addr,
                suggestedParams: { ...params, fee: 1000, flatFee: true, },
                total: 1000000,
                unitName: 'GDST',

            })



            this.logger.info('------------------------------')
            this.logger.info("GoraDAO Staking Asset Creation...");
            let txnId = atxn.txID().toString();
            let signedTxn = await atxn.signTxn(this.goraDaoStakingAdminAccount.sk);
            await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

            let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
            assetId = transactionResponse['asset-index'];
            this.logger.info(`GoraDAO Staking TEST created Asset ID: ${assetId}`);

        } else if (this.isGoraTokenEnforced && !!this.goraToken) {
            assetId = this.goraToken;
            let params = await this.algodClient.getTransactionParams().do();
            const txnOptinStakingAccount = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                this.goraDaoStakingAdminAccount.addr, // from
                this.goraDaoStakingAdminAccount.addr, // to 
                undefined, // closeRemainderTo
                undefined, // note
                0, // amount 
                undefined,// Note
                this.goraToken, // assetID
                params,
                undefined
            );

            const txnSendToStakingAccount = this.algosdk.makeAssetTransferTxnWithSuggestedParams(
                this.goraDaoAdminAccount.addr, // from
                this.goraDaoStakingAdminAccount.addr, // to 
                undefined, // closeRemainderTo
                undefined, // note
                5, // amount 
                undefined,// Note
                this.goraToken, // assetID
                params,
                undefined
            );

            const signedTxnOptinStakingAccount = txnOptinStakingAccount.signTxn(this.goraDaoStakingAdminAccount.sk);
            const signedOptinStakingAccountTxnResponse = await await this.algodClient.sendRawTransaction(signedTxnOptinStakingAccount).do();
            this.logger.info(`Transaction ID: ${signedOptinStakingAccountTxnResponse.txId}`);
            const confirmedSignedOptinUserTxnResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedOptinStakingAccountTxnResponse.txId, 5);
            this.logger.info(`Transaction ${signedOptinStakingAccountTxnResponse.txId} confirmed in round ${confirmedSignedOptinUserTxnResponse['confirmed-round']}.`);
            this.logger.info('By config enforcement, The Staking account has explicitly opted in to the Gora Token')


            const signedTxnSendToStakingAccount = txnSendToStakingAccount.signTxn(this.goraDaoAdminAccount.sk);
            const signedTxnSendToStakingAccountResponse = await await this.algodClient.sendRawTransaction(signedTxnSendToStakingAccount).do();
            this.logger.info(`Transaction ID: ${signedTxnSendToStakingAccountResponse.txId}`);
            const confirmedSignedTxnSendToStakingAccountResponse = await this.algosdk.waitForConfirmation(this.algodClient, signedTxnSendToStakingAccountResponse.txId, 5);
            this.logger.info(`Transaction ${signedTxnSendToStakingAccountResponse.txId} confirmed in round ${confirmedSignedTxnSendToStakingAccountResponse['confirmed-round']}.`);
            this.logger.info('By config enforcement Gora  Token has been sent to Staking creator account successfully')
            this.logger.info(`GoraDAO Staking Asset has explicitly been set to Gora Token (by config values): ${this.goraToken}`);
        }
        this.config['gora_dao']['staking_asa_id'] = assetId;
        this.stakingAsset = assetId
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Staking Asset ID: ${assetId} written to config file!`);
    }

    ////////////////////////////////////////////////////////////////////////
    //////////// GoraDAO Proposals & voting Contract Operations ////////////

    // Only temporary because the actual GoraDao contracts will not be updatable
    async writeProposalContractSourceBox() {
        let addr = this.goraDaoAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoAdminAccount);
        const compiledItemResult = await this.algodClient.compile(this.proposalApprovalProgData).do();
        const compiledItemClearResult = await this.algodClient.compile(this.proposalClearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contract = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))

        const commonParams = {
            sender: addr,
            suggestedParams: params,
            signer: signer,
            fee: 1000,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
            ],
        }
        let method = this.getMethodByName("write_proposal_source_box", contract)

        atc.addMethodCall({
            appID: Number(this.goraDaoMainApplicationId),
            method: method,

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
        let addr = this.goraDaoProposalAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoProposalAdminAccount)
        // const compiledItemResult = await this.algodClient.compile(this.proposalApprovalProgData).do();
        // const compiledItemClearResult = await this.algodClient.compile(this.proposalClearProgData).do();
        // const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        // const compiledResultUint8Dummy = new Uint8Array(compiledResultUint8.length);
        // const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.goraDaoProposalAdminAccount.addr)
        this.logger.info(`${Number(this.proposalAsset)} ${Number(this.goraDaoAsset)}`)
        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,
            appAccounts: [addr],
            appForeignAssets: [Number(this.goraDaoAsset)],

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
                // Number(this.proposalAsset),// DAO asset ref
                Number(this.goraDaoAsset),// DAO asset ID
                "Proposal Test",//title
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

            if (this.config['gora_dao']['network'] == 'testnet') {
                this.config['gora_dao']['asc_testnet_proposal_id'] = Number(res);
                this.config['gora_dao']['asc_testnet_proposal_address'] = addr;

            } else {
                this.config['gora_dao']['asc_proposal_id'] = Number(res);
                this.config['gora_dao']['asc_proposal_address'] = addr;
            }

            this.config['gora_dao']['dao_proposal_deployed'] = true;
            this.proposalApplicationId = Number(res)
            this.proposalApplicationAddress = addr
            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO Proposal Application ID: ${Number(res)} written to config file!`);
            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)



        }

    }
    // Only temporary because the actual GoraDao contracts will not be updatable
    async updateProposalContract() {
        let addr = this.goraDaoProposalAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoProposalAdminAccount)

        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("proposal_app"))
        let clearName = new Uint8Array(Buffer.from("proposal_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.goraDaoProposalAdminAccount.addr)

        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            appAccounts: [addr],
            appForeignAssets: [Number(this.goraDaoAsset)],
            appForeignApps: [Number(this.proposalApplicationId)],
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
                // Number(this.proposalApplicationId),
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
        let proposalAdminAddr = this.goraDaoProposalAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoProposalAdminAccount)
        let methodProposalConfig = this.getMethodByName("config_proposal", proposalContract)
        let methodDaoProposalConfig = this.getMethodByName("config_proposal", goraDaoMainContractAbi)

        let memberPublicKey = this.algosdk.decodeAddress(proposalAdminAddr)
        const commonParamsProposalSetup = {
            appID: proposalApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            sender: proposalAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                // { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("participation_threshold")) },
                // { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("vote_threshold")) },
                // { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("proposal_allocation")) },
                //{ appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("voting_start_timestamp")) },
                // { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },
            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appForeignApps: [Number(this.proposalApplicationId)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            sender: proposalAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        };

        //this.goraDaoMainApplicationId,
        const argsProposal = [

            //2 proposal_min_participation_algo
            10000,
            //3 proposal_min_participation_token
            1,
            //4 proposal_duration
            72,
            //5 proposal_amount
            50,
            //6 proposal_voting_duration
            24,
            //
            0,
            //8 proposal_participation_fee
            1,
            //9 proposal_participation_fee_algo
            11000,
            //10 proposal_vote_fee
            0,
            //11 proposal_vote_fee_algo
            1000,
            //12 participation_threshold (uint64,uint64,uint64)
            // [5, 70, 100000],
            1, // 1 total participation to activate
            //13 vote_threshold (uint64,uint64,uint64)
            // [4, 60, 50000],
            10,// 10% of total participation
            //14 proposal_allocation (uint64,uint64,uint64)
            // [3, 51, 40000],
            // [10, 30, 60],// The allocation of funds to the proposal
            //15 voting_start_timestamp uint64
            3,
            'TEST PROPOSAL RECONFIG',
            'TEST PROPOSAL RECONFIG DESCRIPTION'
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
            methodArgs: [],
            ...commonParamsDaoSetup
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodProposalConfig);
        const proposalConfigResults = await atcProposalConfig.execute(this.algodClient, 10);
        for (const idx in proposalConfigResults.methodResults) {
            let txid = proposalConfigResults.methodResults[idx].txID
            let confirmedRound = proposalConfigResults.confirmedRound;
            let returnedResults = this.algosdk.decodeUint64(proposalConfigResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
        this.config['gora_dao']['dao_proposal_configured'] = true;
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Config written to config file!`);
    }
    async activateProposalContract() {
        let proposalAdminAddr = this.goraDaoProposalAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)

        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoProposalAdminAccount)
        let methodProposalActivate = this.getMethodByName("activate_proposal", proposalContract)

        let memberPublicKey = this.algosdk.decodeAddress(proposalAdminAddr)
        const commonParamsProposalActivate = {
            appID: proposalApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            appForeignApps: [daoApplication],
            sender: proposalAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },
            ],
        }

        const ptxnProposal = new this.algosdk.Transaction({
            from: proposalAdminAddr,
            to: this.proposalApplicationAddress,
            amount: 3000,
            type: 'pay',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: proposalAdminAddr,
            to: this.goraDaoMainApplicationAddress,
            amount: 500000,
            type: 'pay',
            ...params
        })
        const axferDao = new this.algosdk.Transaction({
            from: proposalAdminAddr,
            to: this.goraDaoMainApplicationAddress,
            amount: 1,
            assetIndex: Number(this.goraDaoAsset),
            type: 'axfer',
            ...params
        })
        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: ptxnProposal, signer: signer }
        const tws2 = { txn: axferDao, signer: signer }
        const atcProposalActivate = new this.algosdk.AtomicTransactionComposer()
        atcProposalActivate.addMethodCall({
            method: methodProposalActivate,
            accounts: [this.goraDaoMainApplicationAddress],
            methodArgs: [
                tws0,
                tws1,
                tws2,
            ],
            ...commonParamsProposalActivate
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalActivate);
        const proposalActivateResults = await atcProposalActivate.execute(this.algodClient, 10);
        for (const idx in proposalActivateResults.methodResults) {
            let txid = proposalActivateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalActivateResults.confirmedRound


            let returnedResults = Buffer.from(proposalActivateResults.methodResults[idx].rawReturnValue, "base64").toString()
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // participates to a proposal from e member account
    async participateProposalContract(acct) {
        let account = acct || this.goraDaoUserAccount1;
        let addr = account.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(account)
        let methodProposalParticipate = this.getMethodByName("proposal_participate", proposalContract)
        let methodDaoProposalParticipate = this.getMethodByName("proposal_participate", goraDaoMainContractAbi)
        let proposerPublicKey = this.algosdk.decodeAddress(this.goraDaoProposalAdminAccount.addr)
        let memberPublicKey = this.algosdk.decodeAddress(addr)
        const commonParamsProposalParticipate = {
            appID: proposalApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },
                { appIndex: Number(proposalApplication), name: proposerPublicKey.publicKey },
                { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("participation_threshold")) },



            ],
        }
        const commonParamsDaoParticipate = {
            appID: daoApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoProposalAdminAccount.addr],
            appForeignApps: [Number(this.proposalApplicationId)],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
                { appIndex: Number(daoApplication), name: proposerPublicKey.publicKey },
            ],
        }

        const ptxnFeeDao = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 11000,
            type: 'pay',
            ...params
        })
        const axferFeeDao = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 1,
            assetIndex: Number(this.proposalAsset),
            type: 'axfer',
            ...params
        })
        const ptxnMinAlgo = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 10000,
            type: 'pay',
            ...params
        })
        const axferMinDao = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 2,
            assetIndex: Number(this.proposalAsset),
            type: 'axfer',
            ...params
        })

        const tws0 = { txn: ptxnFeeDao, signer: signer }
        const tws1 = { txn: axferFeeDao, signer: signer }
        const tws2 = { txn: ptxnMinAlgo, signer: signer }
        const tws3 = { txn: axferMinDao, signer: signer }
        const argsDao = []

        const argsProposal = [
            tws0,
            tws1,
            tws2,
            tws3,
        ]
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoParticipate
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalParticipate);
        atcProposalParticipate.addMethodCall({
            method: methodProposalParticipate,
            methodArgs: argsProposal,
            ...commonParamsProposalParticipate
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
        this.config['gora_dao']['participated_to_proposal'] = true;
        await this.saveConfigToFile(this.config)

    }
    // Withdraws participation from a proposal from a member account
    async participationWithdrawProposalContract(acct) {
        let account = acct || this.goraDaoUserAccount1;
        let addr = account.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(account)
        let methodProposalWithdrawParticipate = this.getMethodByName("proposal_withdraw_participate", proposalContract)
        let methodDaoProposalWithdrawParticipate = this.getMethodByName("proposal_withdraw_participate", goraDaoMainContractAbi)
        let memberPublicKey = this.algosdk.decodeAddress(addr)
        let proposerPublicKey = this.algosdk.decodeAddress(this.goraDaoProposalAdminAccount.addr)
        const commonParamsProposalParticipate = {
            appID: proposalApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            appAccounts: [this.goraDaoProposalAdminAccount.addr],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },


            ],
        }
        const commonParamsDaoParticipate = {
            appID: this.goraDaoMainApplicationId,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appForeignApps: [Number(this.proposalApplicationId)],
            appAccounts: [this.goraDaoProposalAdminAccount.addr],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(daoApplication), name: proposerPublicKey.publicKey },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }


        const argsDao = []

        const argsProposal = []
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalWithdrawParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoParticipate
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalWithdrawParticipate);
        atcProposalParticipate.addMethodCall({
            method: methodProposalWithdrawParticipate,
            methodArgs: argsProposal,
            ...commonParamsProposalParticipate
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Proposal Contract ABI Exec method = %s", methodDaoProposalWithdrawParticipate);

        const proposalParticipateResults = await atcProposalParticipate.execute(this.algodClient, 10);
        for (const idx in proposalParticipateResults.methodResults) {
            let txid = proposalParticipateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = proposalParticipateResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(proposalParticipateResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Proposal Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
        this.config['gora_dao']['participated_to_proposal'] = false;
        await this.saveConfigToFile(this.config)

    }
    // This method participates all accounts in the proposal
    async participateProposalContractAll() {
        let accountsArray = [this.goraDaoUserAccount1, this.goraDaoUserAccount2, this.goraDaoUserAccount3, this.goraDaoUserAccount4, this.goraDaoUserAccount5]
        for (let i = 0; i < accountsArray.length; i++) {

            await this.participateProposalContract(accountsArray[i])
        }
        this.config['gora_dao']['participated_to_proposal'] = true;
        this.config['gora_dao']['proposal_is_activated'] = true;
        await this.saveConfigToFile(this.config)
        this.logger.info("All 5 GoraDAO members have participated in the proposal!");
    }
    async participationWithdrawProposalContractAll() {
        let accountsArray = [this.goraDaoUserAccount1, this.goraDaoUserAccount2, this.goraDaoUserAccount3, this.goraDaoUserAccount4, this.goraDaoUserAccount5]
        for (let i = 0; i < accountsArray.length; i++) {

            await this.participationWithdrawProposalContract(accountsArray[i])
        }
        this.config['gora_dao']['participated_to_proposal'] = false;
        this.config['gora_dao']['proposal_is_activated'] = false;
        await this.saveConfigToFile(this.config)
        this.logger.info("All 5 GoraDAO members have withdrawn participation from the proposal!");
    }

    // This method is used to vote on a proposal
    async voteProposalContract(userIndex, vote) {
        let addr = this[`goraDaoUserAccount${userIndex}`].addr;
        let account = this[`goraDaoUserAccount${userIndex}`]
        let proposerAdminAddr = this.goraDaoProposalAdminAccount.addr;
        let proposerPublicKey = this.algosdk.decodeAddress(this.goraDaoProposalAdminAccount.addr)
        let params = await this.algodClient.getTransactionParams().do();
        let proposalApplication = Number(this.proposalApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const proposalContract = new this.algosdk.ABIContract(JSON.parse(this.proposalContract.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(account)
        let methodProposalVote = this.getMethodByName("proposal_vote", proposalContract)
        let methodDaoProposalParticipate = this.getMethodByName("proposal_vote", goraDaoMainContractAbi)
        let memberPublicKey = this.algosdk.decodeAddress(addr)
        const commonParamsProposalVote = {
            appID: proposalApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoProposalAdminAccount.addr, this.goraDaoMainApplicationAddress],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [

                { appIndex: Number(proposalApplication), name: memberPublicKey.publicKey },
                { appIndex: Number(proposalApplication), name: proposerPublicKey.publicKey },
                { appIndex: Number(proposalApplication), name: new Uint8Array(Buffer.from("participation_threshold")) },


            ],
        }
        const commonParamsDaoVote = {
            appID: daoApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.proposalAsset)],
            appAccounts: [this.goraDaoProposalAdminAccount.addr, this.proposalApplicationAddress],
            appForeignApps: [Number(this.proposalApplicationId)],
            sender: addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.proposalApplicationId) },
                { appIndex: Number(proposalApplication), name: proposerPublicKey.publicKey },
                { appIndex: Number(daoApplication), name: proposerPublicKey.publicKey },
            ],
        }
        const axferDao = new this.algosdk.Transaction({
            from: addr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 0,
            assetIndex: Number(this.proposalAsset),
            type: 'axfer',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 1000,
            type: 'pay',
            ...params
        })

        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: axferDao, signer: signer }
        // const tws2 = { txn: ptxnProposal, signer: signer }
        const argsDao = [
            tws0,
            tws1,
            1

        ]

        const argsProposal = [
            Number(vote)
        ]
        const atcProposalParticipate = new this.algosdk.AtomicTransactionComposer()
        atcProposalParticipate.addMethodCall({
            method: methodDaoProposalParticipate,
            methodArgs: argsDao,
            ...commonParamsDaoVote
        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodProposalVote);
        atcProposalParticipate.addMethodCall({
            method: methodProposalVote,
            methodArgs: argsProposal,
            ...commonParamsProposalVote
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

    ////////////////////////////////////////////////////////////////////////
    /////////////// GoraDAO Staking Contract Operations ///////////////

    // Only temporary because the actual GoraDao contracts will not be updatable
    async writeStakingContractSourceBox() {
        let addr = this.goraDaoAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer();
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoAdminAccount);
        const compiledItemResult = await this.algodClient.compile(this.stakingApprovalProgData).do();
        const compiledItemClearResult = await this.algodClient.compile(this.stakingClearProgData).do();
        const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contract = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        let approvalName = new Uint8Array(Buffer.from("staking_app"))
        let clearName = new Uint8Array(Buffer.from("staking_clr"))

        const commonParams = {
            sender: addr,
            suggestedParams: params,
            signer: signer,
            fee: 1000,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
            ],
        }
        let method = this.getMethodByName("write_staking_source_box", contract)

        atc.addMethodCall({
            appID: Number(this.goraDaoMainApplicationId),
            method: method,

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
    // Create GoraDAO Staking Contract
    async createStakingContract() {
        let addr = this.goraDaoStakingAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoStakingAdminAccount)
        // const compiledItemResult = await this.algodClient.compile(this.StakingApprovalProgData).do();
        // const compiledItemClearResult = await this.algodClient.compile(this.StakingClearProgData).do();
        // const compiledResultUint8 = new Uint8Array(Buffer.from(compiledItemResult.result, "base64"));
        // const compiledResultUint8Dummy = new Uint8Array(compiledResultUint8.length);
        // const compiledClearResultUint8 = new Uint8Array(Buffer.from(compiledItemClearResult.result, "base64"));
        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("staking_app"))
        let clearName = new Uint8Array(Buffer.from("staking_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.goraDaoStakingAdminAccount.addr)
        this.logger.info(`${Number(this.stakingAsset)} ${Number(this.goraDaoAsset)}`)
        const commonParams = {
            appID: Number(this.goraDaoMainApplicationId),
            sender: addr,
            appAccounts: [this.goraDaoStakingAdminAccount.addr, this.goraDaoAdminAccount.addr],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.stakingAsset)],
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(this.goraDaoMainApplicationId), name: approvalName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: clearName },
                { appIndex: Number(this.goraDaoMainApplicationId), name: memberPublicKey.publicKey },

            ],
        }
        let method = this.getMethodByName("create_staking", contract)

        const ptxn = new this.algosdk.Transaction({
            from: addr,
            to: this.goraDaoMainApplicationAddress,
            amount: 2000000,
            fee: params.minFee,
            ...params
        })


        const tws0 = { txn: ptxn, signer: signer }


        atc.addMethodCall({
            method: method,

            methodArgs: [
                tws0,//pay
                Number(this.goraDaoAsset),// DAO asset ref
                Number(this.stakingAsset),// Staking asset id
                "Staking_Test",//title
                "This is a test V3 staking for GoraDAO",//description
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
        this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)

        for (let idx in result.methodResults) {
            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Staking Contract ABI Exec method result = %s", addr);
            this.logger.info("GoraDAO Staking Contract topped up by 0.3 Algo!");
            if (this.config.gora_dao.network === 'testnet') {
                this.config['gora_dao']['asc_testnet_staking_id'] = Number(res);
                this.config['gora_dao']['asc_testnet_staking_address'] = addr;
            } else {
                this.config['gora_dao']['asc_staking_id'] = Number(res);
                this.config['gora_dao']['asc_staking_address'] = addr;
            }


            this.goraDaoStakingApplicationId = Number(res)
            this.stakingApplicationAddress = addr
            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO Staking Application ID: ${Number(res)} written to config file!`);
            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)
        }
        this.config['gora_dao']['dao_staking_deployed'] = true;
        await this.saveConfigToFile(this.config)

    }
    // Only temporary because the actual GoraDao contracts will not be updatable
    async updateStakingContract() {
        let addr = this.goraDaoStakingAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        const atc = new this.algosdk.AtomicTransactionComposer()
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoStakingAdminAccount)

        const contractJson = JSON.parse(this.goraDaoMainContractAbi.toString())
        const contract = new this.algosdk.ABIContract(contractJson)
        let approvalName = new Uint8Array(Buffer.from("staking_app"))
        let clearName = new Uint8Array(Buffer.from("staking_clr"))
        let memberPublicKey = this.algosdk.decodeAddress(this.goraDaoStakingAdminAccount.addr)

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
        let method = this.getMethodByName("update_staking", contract)

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
                Number(this.goraDaoStakingApplicationId),
                Number(this.goraDaoStakingApplicationId),
                addr,// member account (Staking manager)
                Number(this.stakingAsset),// Staking asset
                // "Staking_Test_updated",//title
                // "This is an updated test staking for GoraDAO",//description
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
        this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", method);
        const result = await atc.execute(this.algodClient, 10)
        for (let idx in result.methodResults) {

            let res = this.algosdk.decodeUint64(result.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec method result = %s", res);
            let addr = this.algosdk.getApplicationAddress(Number(res))
            this.logger.info("GoraDAO Staking Contract ABI Exec method result = %s", addr);


            let txid = result.methodResults[idx].txID
            let confirmedRound = result.confirmedRound

            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // Configures and sets parameters of a Staking contract (before Staking activation)
    async configureStakingContract() {
        let stakingAdminAddr = this.goraDaoStakingAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let stakingApplication = Number(this.goraDaoStakingApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoStakingAdminAccount)
        let methodStakingConfig = this.getMethodByName("config_staking", goraDaoStakingContractAbi)
        let methodDaoStakingConfig = this.getMethodByName("config_staking", goraDaoMainContractAbi)

        let memberPublicKey = this.algosdk.decodeAddress(stakingAdminAddr)
        const commonParamsStakingSetup = {
            appID: stakingApplication,
            appForeignAssets: [Number(this.stakingAsset)],
            appAccounts: [],
            appForeignApps: [Number(this.goraDaoMainApplicationId), this.stakingParams['staking_proxy_app_id']],
            sender: stakingAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(stakingApplication), name: new Uint8Array(Buffer.from("participation_threshold")) },
                { appIndex: Number(stakingApplication), name: new Uint8Array(Buffer.from("vote_threshold")) },
                { appIndex: Number(stakingApplication), name: new Uint8Array(Buffer.from("staking_allocation")) },
                { appIndex: Number(stakingApplication), name: new Uint8Array(Buffer.from("staking_vote_values")) },
                // { appIndex: Number(stakingApplication), name: memberPublicKey.publicKey },
            ],
        }
        const commonParamsDaoSetup = {
            appID: daoApplication,
            appForeignAssets: [Number(this.stakingAsset)],//Number(this.goraDaoAsset)
            appForeignApps: [Number(this.goraDaoStakingApplicationId)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            sender: stakingAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.goraDaoStakingApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }
        const axferStaking = new this.algosdk.Transaction({
            from: stakingAdminAddr,
            to: `${this.goraDaoMainApplicationAddress}`,
            amount: 1,
            assetIndex: Number(this.goraDaoAsset),
            type: 'axfer',
            ...params
        })
        const ptxnStaking = new this.algosdk.Transaction({
            from: stakingAdminAddr,
            to: this.stakingApplicationAddress,
            amount: 500000,
            type: 'pay',
            ...params
        })
        const ptxnDao = new this.algosdk.Transaction({
            from: stakingAdminAddr,
            to: this.goraDaoMainApplicationAddress,
            amount: 500000,
            type: 'pay',
            ...params
        })

        const tws0 = { txn: ptxnDao, signer: signer }
        const tws1 = { txn: ptxnStaking, signer: signer }
        const tws2 = { txn: axferStaking, signer: signer }
        const argsDao = [
            tws0,
            tws2,
        ];

        //this.goraDaoMainApplicationId,
        const argsStaking = [
            tws1,
            [
                0,// min_algo
                0, // min_token
                6, // duration
                1,// min_duration
                0,// commission
                0,// commission_algo
                0,// fee_token
                0,// fee_algo
                2,// incentives_token
                2,// incentives_algo
                1,// type
                30,// incentives_duration
                17,// return_token
                0, // return_algo
                1,//incentives_eligibility
            ],
            "GoraBots Staking", //name
            "GoraDAO Staking contract for GoraBots NFT Staking",//description
            "https://gora.fi", //staking_url
            "QmWjvCGPyL9zmA5B84WPqLYF27dL2nFgr1Lw6rMd7CpQPV/images/goranetwork_logo.jpeg",//banner
            this.proxyStakingMainAppId, //proxy_staking_main_app_id
            this.proxyStakingVestingAppId //proxy_staking_vesting_app_id

        ]
        const atcStakingConfig = new this.algosdk.AtomicTransactionComposer()

        atcStakingConfig.addMethodCall({
            ...commonParamsStakingSetup,
            method: methodStakingConfig,
            appAccounts: [this.goraDaoMainApplicationAddress],
            methodArgs: argsStaking,

        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodDaoStakingConfig);
        atcStakingConfig.addMethodCall({
            ...commonParamsDaoSetup,
            method: methodDaoStakingConfig,
            appAccounts: [this.stakingApplicationAddress],
            methodArgs: argsDao,

        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", methodStakingConfig);
        const stakingConfigResults = await atcStakingConfig.execute(this.algodClient, 10);
        for (const idx in stakingConfigResults.methodResults) {
            let txid = stakingConfigResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = stakingConfigResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(stakingConfigResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
    }
    // This function is used to activate a staking contract
    async activateStakingContract() {
        let stakingAdminAddr = this.goraDaoStakingAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let stakingApplication = Number(this.goraDaoStakingApplicationId)
        let daoApplication = Number(this.goraDaoMainApplicationId)
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()))
        const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoStakingAdminAccount)
        let methodStakingActivate = this.getMethodByName("activate_staking", goraDaoStakingContractAbi)
        let methodDaoStakingActivate = this.getMethodByName("activate_staking", goraDaoMainContractAbi)

        let memberPublicKey = this.algosdk.decodeAddress(stakingAdminAddr)
        const commonParamsStakingActivate = {
            appID: stakingApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.stakingAsset)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            sender: stakingAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(stakingApplication), name: memberPublicKey.publicKey },
            ],
        }
        const commonParamsDaoActivate = {
            appID: daoApplication,
            appForeignAssets: [Number(this.goraDaoAsset), Number(this.stakingAsset)],
            appForeignApps: [Number(this.goraDaoStakingApplicationId)],
            appAccounts: [this.goraDaoAdminAccount.addr],
            sender: stakingAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(daoApplication), name: this.algosdk.encodeUint64(this.goraDaoStakingApplicationId) },
                { appIndex: Number(daoApplication), name: memberPublicKey.publicKey },
            ],
        }
        const argsDao = [

        ];
        //this.goraDaoMainApplicationId,
        const argsStaking = [


        ];
        const atcStakingActivate = new this.algosdk.AtomicTransactionComposer()

        atcStakingActivate.addMethodCall({
            ...commonParamsStakingActivate,
            method: methodStakingActivate,
            appAccounts: [this.goraDaoMainApplicationAddress],
            methodArgs: argsStaking,

        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodDaoStakingActivate);
        atcStakingActivate.addMethodCall({
            ...commonParamsDaoActivate,
            method: methodDaoStakingActivate,
            appAccounts: [this.stakingApplicationAddress],
            methodArgs: argsDao,

        })
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", methodStakingActivate);
        const stakingActivateResults = await atcStakingActivate.execute(this.algodClient, 10);
        for (const idx in stakingActivateResults.methodResults) {
            let txid = stakingActivateResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = stakingActivateResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(stakingActivateResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
        this.config['gora_dao']['staking_is_activated'] = true;
        await this.saveConfigToFile(this.config)
    }

    // This function is used to register a staking NFT into a V3 staking contract
    async registerStakingNFT(asaId, value) {
        let stakingAdminAddr = this.goraDaoStakingAdminAccount.addr;
        let params = await this.algodClient.getTransactionParams().do();
        let stakingApplication = Number(this.goraDaoStakingApplicationId)
        const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()))
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this.goraDaoStakingAdminAccount)
        let methodStakingNft = this.getMethodByName("register_nft", goraDaoStakingContractAbi)


        let memberPublicKey = this.algosdk.decodeAddress(stakingAdminAddr)
        const commonParamsStakingNft = {
            appID: stakingApplication,
            appForeignAssets: [Number(this.stakingAsset), asaId],
            appAccounts: [this.goraDaoAdminAccount.addr],
            appForeignApps: [Number(this.goraDaoMainApplicationId)],
            sender: stakingAdminAddr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(stakingApplication), name: memberPublicKey.publicKey },
                { appIndex: Number(stakingApplication), name: this.algosdk.encodeUint64(asaId) },
            ],
        }


        //this.goraDaoMainApplicationId,
        const argsStakingNft = [
            asaId,
            value
        ];
        const atcStakingNft = new this.algosdk.AtomicTransactionComposer()

        atcStakingNft.addMethodCall({
            ...commonParamsStakingNft,
            method: methodStakingNft,

            methodArgs: argsStakingNft,

        })


        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", methodStakingNft);
        const stakingNftResults = await atcStakingNft.execute(this.algodClient, 10);
        for (const idx in stakingNftResults.methodResults) {
            let txid = stakingNftResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = stakingNftResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(stakingNftResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
        this.config['gora_dao']['staking_is_activated'] = true;
        await this.saveConfigToFile(this.config)
    }
    getFirst4BytesOfSHA512_256(input) {
        // Create a SHA-512/256 hash object
        const hash = crypto.createHash('sha512-256');

        // Update the hash with the input string
        hash.update(input);

        // Calculate the hash in hexadecimal format
        const fullHashHex = hash.digest('hex');

        // Convert the first 4 bytes (8 hex characters) to a Uint8Array
        const first4BytesHex = fullHashHex.slice(0, 8);
        const first4Bytes = Uint8Array.from(Buffer.from(first4BytesHex, 'hex'));

        return first4Bytes;
    }
    // This function is used to stake in a proxy staking contract
    async stakeProxyStakingContract(userIndex, amount, nftIds) {
        this.logger.info(`Staking into proxy staking contract ${Number(this.goraDaoStakingApplicationId)} which proxies ${Number(this.stakingParams.staking_proxy_app_id)}`);
        let params = await this.algodClient.getTransactionParams().do();// Get suggested Algorand TXN parameters

        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()));
        const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()));
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this[`goraDaoUserAccount${userIndex}`]);

        let methodStakingStake = this.getMethodByName("stake", goraDaoStakingContractAbi);
        let methodDaoStakingStake = this.getMethodByName("stake", goraDaoMainContractAbi);

        let stakeAdminPublicKey = this.algosdk.decodeAddress(this.goraDaoStakingAdminAccount.addr);// Staking admin account PK
        let stakingUserPublicKey = this.algosdk.decodeAddress(this[`goraDaoUserAccount${userIndex}`].addr);// Connected end user wallet account PK
        let v2AppIdArray = this.algosdk.encodeUint64(this.stakingParams['staking_proxy_app_id'])
        let v2AppIdArrayLength = v2AppIdArray.length
        let stakeUserPublicKeyLength = stakingUserPublicKey.publicKey.length
        let boxNameRef = new Uint8Array(v2AppIdArrayLength + stakeUserPublicKeyLength)
        boxNameRef.set(stakingUserPublicKey.publicKey, 0)
        boxNameRef.set(v2AppIdArray, stakeUserPublicKeyLength)
        let NftTxnGroupsArray = []
        for (let index = 0; index < nftIds.length; index++) {
            const nftId = Number(nftIds[index]);
            // Common parameters for GoraDAO main contract
            const commonParamsDao = {
                appID: Number(this.goraDaoMainApplicationId),
                appForeignAssets: [Number(this.stakingAsset), nftId],
                appAccounts: [this.goraDaoStakingAdminAccount.addr, this.stakingApplicationAddress],
                appForeignApps: [Number(this.goraDaoStakingApplicationId)],
                sender: this[`goraDaoUserAccount${userIndex}`].addr,
                suggestedParams: params,
                signer: signer,
                boxes: [
                    { appIndex: Number(this.goraDaoMainApplicationId), name: stakeAdminPublicKey.publicKey },// Staking admin account
                ],
            }
            // Common parameters for GoraDAO Staking contract
            const commonParamsStakingStake = {
                appID: Number(this.goraDaoStakingApplicationId),
                appForeignAssets: [Number(this.stakingAsset), nftId],
                appAccounts: [],
                appForeignApps: [Number(this.stakingParams['staking_proxy_app_id'])],
                sender: this[`goraDaoUserAccount${userIndex}`].addr,
                suggestedParams: params,
                signer: signer,
                boxes: [
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: boxNameRef },// Delegator+V2 App ID Ref
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: this.algosdk.encodeUint64(nftId) },// Staked NFT ref
                ],
            }
            // Asset transfer transaction to DAO (For future usage with staking Fees! Now it is 0 amount)
            const axferDao = new this.algosdk.Transaction({
                from: this[`goraDaoUserAccount${userIndex}`].addr,
                to: `${this.goraDaoMainApplicationAddress}`,
                amount: 0,
                assetIndex: Number(this.stakingAsset),
                type: 'axfer',
                ...params
            })
            // Pay transaction to DAO (For future usage with staking Fees! Now it is 0 amount)
            const ptxnDao = new this.algosdk.Transaction({
                from: this[`goraDaoUserAccount${userIndex}`].addr,
                to: this.goraDaoMainApplicationAddress,
                amount: 0,
                type: 'pay',
                ...params
            })
            // Asset transfer transaction to Staking contract
            const axferStaking = new this.algosdk.Transaction({
                from: this[`goraDaoUserAccount${userIndex}`].addr,
                to: `${this.stakingApplicationAddress}`,
                amount: 0,
                assetIndex: Number(this.stakingAsset),
                type: 'axfer',
                ...params
            });
            // Pay transaction to Staking contract
            const ptxnStaking = new this.algosdk.Transaction({
                from: this[`goraDaoUserAccount${userIndex}`].addr,
                to: this.stakingApplicationAddress,
                amount: 0,
                type: 'pay',
                ...params
            });
            const tws0 = { txn: ptxnDao, signer: signer }
            const tws1 = { txn: axferDao, signer: signer }
            const tws2 = { txn: ptxnStaking, signer: signer }
            const tws3 = { txn: axferStaking, signer: signer }
            // GoraDAO staking ABI call arguments
            const argsDao = [
                tws0,
                tws1,
            ];
            // GoraDAO Staking ABI call arguments
            const argsStaking = [
                tws2,
                tws3,
                nftId,// NFT ASA ID
            ];
            // Atomic transaction composer for GoraDAO proxy Staking
            const atcStakingStake = new this.algosdk.AtomicTransactionComposer();
            // Add GoraDAO DAO ABI call for staking
            atcStakingStake.addMethodCall({
                method: methodDaoStakingStake,
                methodArgs: argsDao,
                ...commonParamsDao
            })

            this.logger.info('------------------------------')
            this.logger.info("GoraDAO Staking Contract ABI Exec method = %s", `${methodDaoStakingStake.name}(${methodDaoStakingStake.args.map(item => item.type)})${methodDaoStakingStake.returns.type}`);

            // Add GoraDAO Staking ABI call for staking
            atcStakingStake.addMethodCall({
                method: methodStakingStake,
                methodArgs: argsStaking,
                ...commonParamsStakingStake
            });

            this.logger.info('------------------------------')
            this.logger.info("GoraDAO Contract ABI Exec method = %s", methodStakingStake);
            NftTxnGroupsArray.push([...atcStakingStake.transactions])
            //Execute the atomic transaction
            const stakingStakeResults = await atcStakingStake.execute(this.algodClient, 10);
            for (const idx in stakingStakeResults.methodResults) {
                let txid = stakingStakeResults.methodResults[idx].txID

                //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
                let confirmedRound = stakingStakeResults.confirmedRound


                let returnedResults = this.algosdk.decodeUint64(stakingStakeResults.methodResults[idx].rawReturnValue, "mixed")
                this.logger.info("GoraDAO Staking Contract ABI Exec result = %s", returnedResults);
                await this.printTransactionLogsFromIndexer(txid, confirmedRound)

            }
            this.config['gora_dao']['staking_is_staked'] = true;
            let nfts = this.config['gora_dao'].network === 'mainnet' ? this.config['gora_dao']['deployer']['nft_staking_mainnet_assets'] : this.config['gora_dao']['deployer']['nft_staking_testnet_assets']
            for (let index = 0; index < nfts.length; index++) {
                if (nfts[index].asset == nftId) {
                    nfts[index].isLocked = true;
                }
            }
            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO Staking status to config file!`);
            //await this.printStakingNFTBox(nftId);
        }

        this.logger.info('------------------------------')


    }
    concatArrays(arrays) {
        // Calculate the total length of the concatenated array
        let totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);

        // Create a new Uint8Array with the total length
        let result = new Uint8Array(totalLength);

        // Track the position where the next array will be placed
        let offset = 0;

        // Iterate over the input arrays and copy their contents into the result array
        for (let array of arrays) {
            result.set(array, offset);
            offset += array.length;
        }

        return result;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // This function is used to stake in a proxy staking contract
    async unstakeProxyStakingContract(userIndex, amount, nftIds) {

        let parentTxnGroupsArray = []
        for (let index = 0; index < nftIds.length; index++) {
            const nftId = Number(nftIds[index]);
            this.logger.info(`Staking into proxy staking contract ${Number(this.goraDaoStakingApplicationId)} which proxies ${Number(this.stakingParams.staking_proxy_app_id)}`);
            let params = await this.algodClient.getTransactionParams().do();// Get suggested Algorand TXN parameters



            const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()));
            const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()));
            const signer = this.algosdk.makeBasicAccountTransactionSigner(this[`goraDaoUserAccount${userIndex}`]);

            let methodDaoStakingUnstake = this.getMethodByName("unstake", goraDaoMainContractAbi);
            let methodStakingUnstake = this.getMethodByName("unstake", goraDaoStakingContractAbi);

            let stakeAdminPublicKey = this.algosdk.decodeAddress(this.goraDaoStakingAdminAccount.addr);// Staking admin account PK
            let stakingUserPublicKey = this.algosdk.decodeAddress(this[`goraDaoUserAccount${userIndex}`].addr);// Connected end user wallet account PK

            // Common parameters for GoraDAO main contract
            const commonParamsDao = {
                appID: Number(this.goraDaoMainApplicationId),
                appForeignAssets: [Number(this.stakingAsset), nftId],
                appAccounts: [this.goraDaoStakingAdminAccount.addr, this.stakingApplicationAddress],
                appForeignApps: [Number(this.goraDaoStakingApplicationId)],
                sender: this[`goraDaoUserAccount${userIndex}`].addr,
                suggestedParams: params,
                signer: signer,
                boxes: [

                    { appIndex: Number(this.goraDaoMainApplicationId), name: stakeAdminPublicKey.publicKey },// Staking admin account
                ],
            }




            let methodDaoUnstakeFullName = `${methodDaoStakingUnstake.name}(${methodDaoStakingUnstake.args.map(item => item.type)})${methodDaoStakingUnstake.returns.type}`;
            let methodDaoUnstakeArg = this.getFirst4BytesOfSHA512_256(methodDaoUnstakeFullName);
            const daoUnstakeArgs = [
                methodDaoUnstakeArg,
                this.algosdk.encodeUint64(0),
                this.algosdk.encodeUint64(0),
            ];
            const txnDaoUnstake = this.algosdk.makeApplicationCallTxnFromObject({
                accounts: commonParamsDao.appAccounts,
                appArgs: daoUnstakeArgs,
                appIndex: commonParamsDao.appID,
                from: commonParamsDao.sender,
                foreignApps: commonParamsDao.appForeignApps,
                foreignAssets: commonParamsDao.appForeignAssets,
                note: new Uint8Array(Buffer.from(`Unstaking NFT ${nftId}`)),
                boxes: commonParamsDao.boxes,
                suggestedParams: commonParamsDao.suggestedParams,


            })
            this.logger.info('------------------------------')




            let v2AppIdArray = this.algosdk.encodeUint64(this.stakingParams['staking_proxy_app_id'])
            let v2AppIdArrayLength = v2AppIdArray.length
            let stakeUserPublicKeyLength = stakingUserPublicKey.publicKey.length
            let boxNameRef = new Uint8Array(v2AppIdArrayLength + stakeUserPublicKeyLength)
            boxNameRef.set(stakingUserPublicKey.publicKey, 0)
            boxNameRef.set(v2AppIdArray, stakeUserPublicKeyLength)
            // Common parameters for GoraDAO Staking contract
            const commonParamsStakingUnstake = {
                appID: Number(this.goraDaoStakingApplicationId),
                appForeignAssets: [Number(this.stakingAsset), nftId],
                appAccounts: [this.stakingParams['staking_proxy_app_address']],
                appForeignApps: [Number(this.stakingParams['staking_proxy_app_id'])],
                sender: this[`goraDaoUserAccount${userIndex}`].addr,
                suggestedParams: params,
                signer: signer,
                boxes: [
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: boxNameRef },// Staking admin account
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: stakingUserPublicKey.publicKey },// Connected end user wallet account
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: this.algosdk.encodeUint64(nftId) },// Staked NFT ref
                ],
            }
            let methodStakingUnstakeFullName = `${methodStakingUnstake.name}(${methodStakingUnstake.args.map(item => item.type)})${methodStakingUnstake.returns.type}`;
            let methodStakingUnstakeArg = this.getFirst4BytesOfSHA512_256(methodStakingUnstakeFullName);
            const stakingUnstakeArgs = [
                methodStakingUnstakeArg,
                this.algosdk.encodeUint64(0),
                this.algosdk.encodeUint64(0),
                this.algosdk.encodeUint64(nftId),
            ];
            const txnStakingUnstake = this.algosdk.makeApplicationCallTxnFromObject({
                accounts: commonParamsStakingUnstake.appAccounts,
                appArgs: stakingUnstakeArgs,
                appIndex: commonParamsStakingUnstake.appID,
                foreignApps: commonParamsStakingUnstake.appForeignApps,
                foreignAssets: commonParamsStakingUnstake.appForeignAssets,
                note: new Uint8Array(Buffer.from(`Unstaking NFT ${nftId}`)),
                boxes: commonParamsStakingUnstake.boxes,
                from: commonParamsStakingUnstake.sender,
                suggestedParams: commonParamsStakingUnstake.suggestedParams
            })
            // Add GoraDAO Staking ABI call for staking

            this.logger.info('------------------------------')
            let methodDStakingUserClaim = this.getMethodByName("user_claim", goraDaoStakingContractAbi);

            const commonParamsStakingClaim = {
                appID: Number(this.goraDaoStakingApplicationId),
                appForeignAssets: [Number(this.stakingAsset), nftId],
                appAccounts: [this.stakingParams['staking_proxy_app_address'], this.stakingParams['staking_proxy_app_manager']],
                appForeignApps: [Number(this.stakingParams['staking_proxy_app_id'])],
                sender: this[`goraDaoUserAccount${userIndex}`].addr,
                suggestedParams: params,
                signer: signer,
                boxes: [
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: boxNameRef },// Staking admin account
                    { appIndex: Number(this.goraDaoStakingApplicationId), name: this.algosdk.encodeUint64(nftId) },// NFT_ASA_ID
                ],
            }
            let methodStakingClaimFullName = `${methodDStakingUserClaim.name}(${methodDStakingUserClaim.args.map(item => item.type)})${methodDStakingUserClaim.returns.type}`;
            let methodStakingClaimArg = this.getFirst4BytesOfSHA512_256(methodStakingClaimFullName);
            const stakingClaimArgs = [
                methodStakingClaimArg,
                this.algosdk.encodeUint64(nftId),
            ];
            const txnStakingClaim = this.algosdk.makeApplicationCallTxnFromObject({
                accounts: commonParamsStakingClaim.appAccounts,
                appArgs: stakingClaimArgs,
                appIndex: commonParamsStakingClaim.appID,
                foreignApps: commonParamsStakingClaim.appForeignApps,
                foreignAssets: commonParamsStakingClaim.appForeignAssets,
                note: new Uint8Array(Buffer.from(`Claiming Rewards for NFT ${nftId}`)),
                boxes: commonParamsStakingClaim.boxes,
                from: commonParamsStakingClaim.sender,
                suggestedParams: commonParamsStakingClaim.suggestedParams
            })

            let txnGroup = [txnDaoUnstake, txnStakingUnstake, txnStakingClaim]
            txnGroup = this.algosdk.assignGroupID(txnGroup)
            const txnGroupFinal = [
                txnGroup[0].signTxn(this.goraDaoUserAccount2.sk),
                txnGroup[1].signTxn(this.goraDaoUserAccount2.sk),
                txnGroup[2].signTxn(this.goraDaoUserAccount2.sk)
            ]


            this.logger.info('Sending Unstake Transaction Group');
            parentTxnGroupsArray.push(this.concatArrays(txnGroupFinal))
            //parentTxnGroupsArray.push(txnGroupFinal)

            // const { txId } = await this.algodClient.sendRawTransaction(txnGroupFinal).do();

            // const waitForTxn = await this.algosdk.waitForConfirmation(this.algodClient, txId, 5);
            // this.logger.info(`Transaction ${txId} confirmed in round ${waitForTxn['confirmed-round']}.`);


            this.config['gora_dao']['staking_is_unstaked'] = true;
            let nfts = this.config['gora_dao'].network === 'mainnet' ? this.config['gora_dao']['deployer']['nft_staking_mainnet_assets'] : this.config['gora_dao']['deployer']['nft_staking_testnet_assets']
            for (let index = 0; index < nfts.length; index++) {
                if (nfts[index].asset == nftId) {
                    nfts[index].isLocked = false;
                }
            }

            await this.saveConfigToFile(this.config)
            this.logger.info(`GoraDAO UnStaking status to config file!`);
            //await this.printStakingNFTBox(nftId)

        }

        const that = this
        let executeTxn = async (txnGroup) => {
            const { txId } = await that.algodClient.sendRawTransaction(txnGroup).do();
            const waitForTxn = await that.algosdk.waitForConfirmation(that.algodClient, txId, 5);
            that.logger.info(`Transaction ${txId} confirmed in round ${waitForTxn['confirmed-round']}.`);


        }

        parentTxnGroupsArray.forEach((txnGroup) =>
            executeTxn(txnGroup))

        // await this.algodClient.sendRawTransaction(this.concatArrays(parentTxnGroupsArray)).do();

    }
    // This function is used to iterate N NFTs minting and save them to config for testing purposes
    async iterativeMintingTestNfts(assetQuantity) {
        let assetId = 0
        let assetArray = []
        // Get suggested Algorand TXN parameters
        let params = await this.algodClient.getTransactionParams().do();
        for (let index = 0; index < assetQuantity; index++) {
            this.logger.info('------------------------------')
            this.logger.info(`Creating GoraDAO Testing NFT staking Asset #${(index + 1) * 100000}...`);
            // Create NFT asset transaction with suggested parameters
            const atxn = this.algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
                assetMetadataHash: new Uint8Array(32),
                assetName: `GoraBots#${(index + 1) * 100000}`,
                assetURL: 'https://gora.io',
                clawback: this.goraDaoUserAccount2.addr,
                freeze: this.goraDaoUserAccount2.addr,
                decimals: 0,
                defaultFrozen: false,
                from: this.goraDaoUserAccount2.addr,
                manager: this.goraDaoUserAccount2.addr,
                note: new Uint8Array(Buffer.from(`GoraDAO NFT Staking TEST Asset #${index}`)),
                reserve: this.goraDaoUserAccount2.addr,
                suggestedParams: { ...params, fee: 1000, flatFee: true, },
                total: 1,
                unitName: `GBOT${(index + 1) * 100000}`,


            })

            let txnId = atxn.txID().toString();
            let signedTxn = await atxn.signTxn(this.goraDaoUserAccount2.sk);
            await this.algodClient.sendRawTransaction(signedTxn).do();
            await this.algosdk.waitForConfirmation(this.algodClient, txnId, 10)

            let transactionResponse = await this.algodClient.pendingTransactionInformation(txnId).do();
            assetId = transactionResponse['asset-index'];
            let value = this.getRandomInt(5, 10);
            assetArray.push({
                asset: assetId,
                value: value,
                isLocked: false,
            })
            this.logger.info(`GoraDAO Staking TEST created Asset ID: ${assetId} with Gora native Token value: ${value} created!`);
        }
        if (this.config['gora_dao'].network === 'mainnet') {
            this.config['deployer']['nft_staking_mainnet_assets'] = assetArray;
        } else {
            this.config['deployer']['nft_staking_testnet_assets'] = assetArray;
        }


        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Staking Assets array written to config file!`);
    }

    async userClaimProxyStakingContract(userIndex, nftId) {
        this.logger.info(`Claims rewards from proxy staking contract ${Number(this.goraDaoStakingApplicationId)} which proxies ${Number(this.stakingParams.staking_proxy_app_id)}`);
        let params = await this.algodClient.getTransactionParams().do();// Get suggested Algorand TXN parameters
        const goraDaoStakingContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoStakingContractAbi.toString()));
        const signer = this.algosdk.makeBasicAccountTransactionSigner(this[`goraDaoUserAccount${userIndex}`]);
        const goraDaoMainContractAbi = new this.algosdk.ABIContract(JSON.parse(this.goraDaoMainContractAbi.toString()));
        let methodDStakingUserClaim = this.getMethodByName("user_claim", goraDaoStakingContractAbi);
        let stakingUserPublicKey = this.algosdk.decodeAddress(this[`goraDaoUserAccount${userIndex}`].addr);// Connected end user wallet account PK
        let v2AppIdArray = this.algosdk.encodeUint64(this.stakingParams['staking_proxy_app_id'])
        let v2AppIdArrayLength = v2AppIdArray.length
        let stakeUserPublicKeyLength = stakingUserPublicKey.publicKey.length
        let boxNameRef = new Uint8Array(v2AppIdArrayLength + stakeUserPublicKeyLength)
        boxNameRef.set(stakingUserPublicKey.publicKey, 0)
        boxNameRef.set(v2AppIdArray, stakeUserPublicKeyLength)
        // Common parameters for GoraDAO Staking contract
        const commonParamsStakingStake = {
            appID: Number(this.goraDaoStakingApplicationId),
            appForeignAssets: [Number(this.stakingAsset), nftId],
            appAccounts: [this.stakingParams['staking_proxy_app_address'], this.stakingParams['staking_proxy_app_manager'], "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"],
            appForeignApps: [Number(this.stakingParams['staking_proxy_app_id'])/* , Number(this.proxyStakingMainAppId) */],
            sender: this[`goraDaoUserAccount${userIndex}`].addr,
            suggestedParams: params,
            signer: signer,
            boxes: [
                { appIndex: Number(this.goraDaoStakingApplicationId), name: boxNameRef },// Staking admin account
                { appIndex: Number(this.goraDaoStakingApplicationId), name: this.algosdk.encodeUint64(nftId) },// NFT_ASA_ID
            ],
        }

        const claimStaking = [nftId];// NFT ASA ID for claiming its rewards without unstaking
        const atcStakingClaim = new this.algosdk.AtomicTransactionComposer();


        atcStakingClaim.addMethodCall({
            method: methodDStakingUserClaim,
            methodArgs: claimStaking,
            ...commonParamsStakingStake
        });
        this.logger.info('------------------------------')
        this.logger.info("GoraDAO Contract ABI Exec method = %s", methodDStakingUserClaim);

        // Execute the atomic transaction
        const stakingStakeResults = await atcStakingClaim.execute(this.algodClient, 10);
        for (const idx in stakingStakeResults.methodResults) {
            let txid = stakingStakeResults.methodResults[idx].txID

            //if (Number(idx) === 0) this.logger.info(`actual results update txn ID: ${txid}`)
            let confirmedRound = stakingStakeResults.confirmedRound


            let returnedResults = this.algosdk.decodeUint64(stakingStakeResults.methodResults[idx].rawReturnValue, "mixed")
            this.logger.info("GoraDAO Staking Contract ABI Exec result = %s", returnedResults);
            await this.printTransactionLogsFromIndexer(txid, confirmedRound)

        }
        this.config['gora_dao']['staking_is_staked'] = true;
        await this.saveConfigToFile(this.config)
        this.logger.info(`GoraDAO Staking status to config file!`);


    }
}

module.exports = GoraDaoDeployer