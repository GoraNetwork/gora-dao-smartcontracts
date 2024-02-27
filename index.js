const algosdk = require('algosdk');
const fs = require('fs')
const path = require('path');
const inquirer = require('inquirer');
// Configuration JSON
const config = require('./config.json');
// Logger module
const logger = require('./logger');
// Gora deployer Class module
const GoraDaoDeployer = require('./gora-dao-deployer');
let props = {}
// Mnemonics
props.mnemonic0 = fs.readFileSync(path.join(__dirname, 'gora_mnemonic0.txt'), 'utf8')
// props.mnemonic1 = fs.readFileSync(path.join(__dirname, 'gora_mnemonic1.txt'), 'utf8')
// props.mnemonic2 = fs.readFileSync(path.join(__dirname, 'gora_mnemonic2.txt'), 'utf8')
// props.mnemonic3 = fs.readFileSync(path.join(__dirname, 'gora_mnemonic3.txt'), 'utf8')
// Configurations
props.config = config
// AlgoSDK
props.algosdk = algosdk
// Logger
props.logger = logger

// GoraDao main contract sources
props.daoApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-main.teal'))
props.daoClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'))

// GoraDao Proposal Contract sources
props.proposalApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-proposal.teal'));
props.proposalClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'));

// GoraDao Vesting Contract sources
props.vestingApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-vesting.teal'));
props.vestingClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'));

// GoraDao contract ABIs (Dao main, Proposal and vesting)
props.daoContract = fs.readFileSync(path.join(__dirname, 'gora-dao-abi.json'));
props.proposalContract = fs.readFileSync(path.join(__dirname, 'gora-dao-proposal-abi.json'));
props.vestingContract = fs.readFileSync(path.join(__dirname, 'gora-dao-vesting-abi.json'));

// GoraDao Deployer instantiating
const goraDaoDeployer = new GoraDaoDeployer(props)
//Running GoraDao Deployer with config on node process


async function goraDAOOperations() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'goraDAOOperation',
            message: 'Select a GoraDAO operation:',
            choices: [
                'Deploy GoraDAO Contract',
                'Update GoraDAO Contracts',
                'Configure Deployed GoraDAO',
                'Subscribe to GoraDAO',
                'Unsubscribe from GoraDAO',
                'Create GoraDAO Asset',
                'Back to Main Menu'
            ],
        },
    ]);

    switch (answers.goraDAOOperation) {
        case 'Deploy GoraDAO Contract':
            await goraDaoDeployer.deployGoraDAOContract();
            break;
        case 'Update GoraDAO Contracts':
            await goraDaoDeployer.updateGoraDAOContracts();
            break;
        case 'Configure Deployed GoraDAO':
            await goraDaoDeployer.configureDeployedGoraDAO();
            break;
        case 'Subscribe to GoraDAO':
            await goraDaoDeployer.subscribeToGoraDAO();
            break;
        case 'Unsubscribe from GoraDAO':
            await goraDaoDeployer.unsubscribeFromGoraDAO();
            break;
        case 'Create GoraDAO Asset':
            await goraDaoDeployer.createGoraDAOAsset();
            break;
        case 'Back to Main Menu':
            await mainMenu();
            break;
    }

    // Loop back to GoraDAO operations menu unless going back to main menu
    if (answers.goraDAOOperation !== 'Back to Main Menu') {
        await goraDAOOperations();
    }
}
async function proposalsOperations() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'proposalOperation',
            message: 'Select a proposal operation:',
            choices: [
                'Create GoraDAO Proposals Asset',
                'Deploy New Proposal',
                'Update Deployed Proposal',
                'Configure Proposal',
                'Participate into Proposal',
                'Withdraw Participation',
                'Vote on Proposal',
                'Activate Proposal',
                'Close Proposal',
                'Back to Main Menu'
            ],
        },
    ]);

    switch (answers.proposalOperation) {
        case 'Create GoraDAO Proposals Asset':
            await goraDaoDeployer.createGoraDAOProposalsAsset();
            break;
        case 'Deploy New Proposal':
            await goraDaoDeployer.deployNewProposal();
            break;
        case 'Update Deployed Proposal':
            await goraDaoDeployer.updateDeployedProposal();
            break;
        case 'Configure Proposal':
            await goraDaoDeployer.configureProposal();
            break;
        case 'Participate into Proposal':
            await goraDaoDeployer.participateIntoProposal();
            break;
        case 'Withdraw Participation':
            await goraDaoDeployer.withdrawParticipation();
            break;
        case 'Vote on Proposal':
            await goraDaoDeployer.voteOnProposal();
            break;
        case 'Activate Proposal':
            await goraDaoDeployer.activateProposal();
            break;
        case 'Close Proposal':
            await goraDaoDeployer.closeProposal();
            break;
        case 'Back to Main Menu':
            await mainMenu();
            break;
    }

    // Loop back to proposals operations menu unless going back to main menu
    if (answers.proposalOperation !== 'Back to Main Menu') {
        await proposalsOperations();
    }
}

async function mainMenu() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select the operation you would like to perform:',
            choices: [
                'Create Test Accounts',
                'Test Account Stats',
                'Test Account Dispense',
                'GoraDAO Operations',
                'Proposals Operations',
                'Exit'
            ],
        },
    ]);

    switch (answers.action) {
        case 'Create Test Accounts':
            // Assuming createTestAccounts is a method in GoraDaoDeployer
            await goraDaoDeployer.createTestAccounts();
            break;
        case 'Test Account Stats':
            // Assuming testAccountStats is a method in GoraDaoDeployer
            await goraDaoDeployer.testAccountStats();
            break;
        case 'Test Account Dispense':
            // Assuming testAccountDispense is a method in GoraDaoDeployer
            await goraDaoDeployer.testAccountDispense();
            break;
        case 'GoraDAO Operations':
            await goraDAOOperations();
            break;
        case 'Proposals Operations':
            await proposalsOperations();
            break;
        case 'Exit':
            console.log('Exiting...');
            process.exit(0);
    }

    // Loop back to main menu unless exited
    await mainMenu();
}
// Initialize and run the main menu
mainMenu().catch(err => {
    console.error('An error occurred:', err);
    process.exit(1);
});
