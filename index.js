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
//props.mnemonic0 = fs.readFileSync(path.join(__dirname, 'gora_mnemonic0.txt'), 'utf8')
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
                'Distribute GoraDAO Asset',
                'Subscribe to GoraDAO',
                'Unsubscribe from GoraDAO',

                'Back to Main Menu'
            ],
        },
    ]);

    switch (answers.goraDAOOperation) {
        case 'Deploy GoraDAO Contract':
            try {
                await goraDaoDeployer.deployMainContract();
                await goraDaoDeployer.writeProposalContractSourceBox();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }


            break;
        case 'Update GoraDAO Contracts':
            try {
                await goraDaoDeployer.updateMainContract();
                await goraDaoDeployer.writeProposalContractSourceBox();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }

            break;
        case 'Configure Deployed GoraDAO':
            try {
                await goraDaoDeployer.configMainContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Distribute GoraDAO Asset':
            try {
                await goraDaoDeployer.sendGoraDaoAssetTransaction();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Subscribe to GoraDAO':
            try {
                await goraDaoDeployer.subscribeDaoContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Unsubscribe from GoraDAO':
            try {
                await goraDaoDeployer.unsubscribeDaoContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
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

                'Deploy New Proposal',
                'Update Deployed Proposal',
                'Configure Proposal',
                'Distribute Proposal Asset',
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

        case 'Deploy New Proposal':
            try {
                await goraDaoDeployer.createProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Update Deployed Proposal':
            try {
                await goraDaoDeployer.updateProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Configure Proposal':
            try {
                await goraDaoDeployer.configureProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Distribute Proposal Asset':
            try {
                await goraDaoDeployer.sendProposalAssetTransaction();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Participate into Proposal':
            try {
                await goraDaoDeployer.participateProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Withdraw Participation':
           try {
            await goraDaoDeployer.participationWithdrawProposalContract();
            await inquirer.prompt([
                {
                    type: 'input',
                    name: 'continue',
                    message: 'Press Enter to go back to menu...',
                },
            ]);
            
           } catch (error) {
            console.error('An error occurred:', error);
            await inquirer.prompt([
                {
                    type: 'input',
                    name: 'continue',
                    message: 'Press Enter to go back to menu...',
                },
            ]);
           }
            break;
        case 'Vote on Proposal':
            try {
                await goraDaoDeployer.voteProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Activate Proposal':
            try {
                await goraDaoDeployer.activateProposalContract();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Close Proposal':
            try {
                await goraDaoDeployer.closeProposal();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
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
    await goraDaoDeployer.runDeployer(true)
    console.log(` 
    .d8888b.                           8888888b.        d8888  .d88888b.  
    d88P  Y88b                          888  "Y88b      d88888 d88P" "Y88b 
    888    888                          888    888     d88P888 888     888 
    888         .d88b.  888d888 8888b.  888    888    d88P 888 888     888 
    888  88888 d88""88b 888P"      "88b 888    888   d88P  888 888     888 
    888    888 888  888 888    .d888888 888    888  d88P   888 888     888 
    Y88b  d88P Y88..88P 888    888  888 888  .d88P d8888888888 Y88b. .d88P 
     "Y8888P88  "Y88P"  888    "Y888888 8888888P" d88P     888  "Y88888P"  
                                                                           
                                                                           
                                                                           `)

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select the operation you would like to perform:',
            choices: [

                'Tester Accounts Dispense',
                'Tester Accounts Stats',
                'Create GoraDAO Asset',
                'Create GoraDAO Proposals Asset',

                'GoraDAO Operations',
                'Proposals Operations',
                'Tester Accounts Recreate',
                'Exit'
            ],
        },
    ]);

    switch (answers.action) {
        case 'Create GoraDAO Asset':
            try {
                await goraDaoDeployer.createDaoAsset();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Create GoraDAO Proposals Asset':
            try {
                await goraDaoDeployer.createDaoProposalAsset();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;

        case 'Tester Accounts Recreate':
            // Assuming testAccountStats is a method in GoraDaoDeployer

            try {
                await goraDaoDeployer.sendAllAlgosAndDeleteMnemonics();
                await goraDaoDeployer.deployerReport();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Tester Accounts Stats':
            // Assuming testAccountStats is a method in GoraDaoDeployer

            try {
                await goraDaoDeployer.deployerReport();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
            break;
        case 'Tester Accounts Dispense':
            // Assuming testAccountDispense is a method in GoraDaoDeployer
            try {
                await goraDaoDeployer.testAccountDispense();
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            } catch (error) {
                console.error('An error occurred:', error);
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
            }
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
