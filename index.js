const algosdk = require('algosdk');
const fs = require('fs')
const path = require('path');
const config = require('./config.json');
const logger = require('./logger');
const GoraDaoDeployer = require('./gora-dao-deployer')
let props = {}
props.mnemonic = fs.readFileSync(path.join(__dirname, 'gora_mnemonic.txt'), 'utf8')
props.config = config
props.algosdk = algosdk
props.logger = logger
props.approvalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-main.teal'))
props.clearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'))

props.proposalApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-proposal.teal'));
props.proposalClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'));

props.contract = fs.readFileSync(path.join(__dirname, 'gora-dao-abi.json'));
props.proposalContract = fs.readFileSync(path.join(__dirname, 'gora-dao-proposal-abi.json'));
props.proposal = config.deployer['gora-dao-proposal']
const goraDaoDeployer = new GoraDaoDeployer(props)
goraDaoDeployer.runDeployer()