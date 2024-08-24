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

// GoraDao Staking Contract sources
props.stakingApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-staking.teal'));
props.stakingClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'));

// GoraDao Vesting Contract sources
props.vestingApprovalProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-vesting.teal'));
props.vestingClearProgData = fs.readFileSync(path.join(__dirname, 'gora-dao-clear.teal'));

// GoraDao contract ABIs (Dao main, Proposal and vesting)
props.daoContract = fs.readFileSync(path.join(__dirname, 'gora-dao-abi.json'));
props.proposalContract = fs.readFileSync(path.join(__dirname, 'gora-dao-proposal-abi.json'));
props.goraDaoStakingContractAbi = fs.readFileSync(path.join(__dirname, 'gora-dao-staking-abi.json'));
props.vestingContract = fs.readFileSync(path.join(__dirname, 'gora-dao-vesting-abi.json'));

// GoraDao Deployer instantiating
const goraDaoDeployer = new GoraDaoDeployer(props)
//Running GoraDao Deployer with config on node process


async function goraDAOOperations() {
    let choices = []
    if (!(config['gora_dao']['dao_asa_id'] > 0) && config['gora_dao']['enforce_gora_token'] === false) {
        choices.push('Create GoraDAO Asset')
    }
    if (config['gora_dao']['dao_dao_deployed'] === true) {
        choices.push('Update GoraDAO Contract')
    } else {
        choices.push('Deploy GoraDAO Contract')
    }
    if (config['gora_dao']['dao_dao_deployed'] === true) {
        choices.push('Configure Deployed GoraDAO')
    }
    if (config['gora_dao']['dao_asa_distributed'] === false) {
        choices.push('Distribute GoraDAO Asset')
    } else if (config['gora_dao']['dao_asa_distributed'] === true) {
        choices.push('Re-Distribute GoraDAO Asset')
        choices.push('Re-Distribute GoraDAO Asset(APP Only)')
    }
    if (config['gora_dao']['subscribed_to_dao'] === true) {
        choices.push('Unsubscribe from GoraDAO')
    } else {
        choices.push('Subscribe to GoraDAO')
    }



    choices.push('Help')
    choices.push('Back to Main Menu')


    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'goraDAOOperation',
            message: 'Select a GoraDAO operation:',
            choices: choices,
        },
    ]);

    switch (answers.goraDAOOperation) {
        case 'Deploy GoraDAO Contract':
            try {
                await goraDaoDeployer.deployMainContract();
                await goraDaoDeployer.writeProposalContractSourceBox();
                await goraDaoDeployer.writeStakingContractSourceBox();
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
        case 'Update GoraDAO Contract':
            try {
                await goraDaoDeployer.updateMainContract();
                //await goraDaoDeployer.writeProposalContractSourceBox();
                await goraDaoDeployer.writeStakingContractSourceBox();
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
                await goraDaoDeployer.sendGoraDaoAssetTransaction(false);
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
        case 'Re-Distribute GoraDAO Asset(APP Only)':
            try {
                await goraDaoDeployer.sendGoraDaoAssetTransaction(true);
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
        case 'Re-Distribute GoraDAO Asset':
            try {
                await goraDaoDeployer.sendGoraDaoAssetTransaction(false);
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
                // Subscribing Gora Proposal account to DAO
                await goraDaoDeployer.subscribeDaoContract('proposal');
                // Subscribing Gora Staking account to DAO
                await goraDaoDeployer.subscribeDaoContract('staking');
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
        case 'Help':
            logger.info('GoraDAO Help | DAO Operations Menu');
            logger.info('------------------------------------');
            //logger.info('Test flow: Create DAO Asset ---> Deploy/Update new DAO contract ---> Configure DAO ---> Subscribe/Unsubscribe testing proposer account to/from DAO ---> Go to Proposals Operations to continue!');
            logger.info(`
            +-------------------+       +--------------------------------+       +-------------------+
            |                   |       |                                |       |                   |
            |  Create DAO Asset +------->  Deploy/Update new DAO         +------->  Configure DAO    |
            |                   |       |  contract                      |       |                   |
            +-------------------+       +--------------------------------+       +-------------------+
                                                                                        |
                                                                                        |
                                                                                        v
                                              +-------------------------------------------+       +--------------------------------+
                                              |                                           |       |                                |
                                              |  Subscribe/Unsubscribe testing proposer   +------->  Go to Proposals Operations    |
                                              |  account to/from DAO                      |       |  to continue!                  |
                                              |                                           |       |                                |
                                              +-------------------------------------------+       +--------------------------------+

            
            `);
            logger.info('Create GoraDAO Asset: Create the GoraDAO asset');
            logger.info('Deploy GoraDAO Contract: Deploy the GoraDAO contract');
            logger.info('Update GoraDAO Contract: Update the GoraDAO contract');
            logger.info('Configure Deployed GoraDAO: Configure the deployed GoraDAO contract');
            logger.info('Distribute GoraDAO Asset: Distribute the GoraDAO asset');
            logger.info('Subscribe to GoraDAO: Subscribe to the GoraDAO');
            logger.info('Unsubscribe from GoraDAO: Unsubscribe from the GoraDAO');

            await inquirer.prompt([
                {
                    type: 'input',
                    name: 'continue',
                    message: 'Press Enter to go back to menu...',
                },
            ]);
            break;
        case 'Back to Main Menu':
            await mainMenu(true);
            break;
    }

    // Loop back to GoraDAO operations menu unless going back to main menu
    if (answers.goraDAOOperation !== 'Back to Main Menu') {
        await goraDAOOperations();
    }
}
async function proposalsOperations() {
    let choices = [];
    if (!(Number(config['gora_dao']['proposal_asa_id']) > 0)) {
        choices.push('Create GoraDAO Proposals Asset',)
    }
    if (config['gora_dao']['dao_proposal_deployed'] === false) {
        choices.push('Deploy New Proposal')
    } else {
        choices.push('Update Deployed Proposal')
    }
    if (config['gora_dao']['dao_proposal_deployed'] === true) {
        choices.push('Configure Proposal')
    }
    if (config['gora_dao']['dao_proposal_deployed'] === true && config['gora_dao']['proposal_asa_distributed'] === false) {
        choices.push('Distribute Proposal Asset')
    } else if (config['gora_dao']['dao_proposal_deployed'] === true && config['gora_dao']['proposal_asa_distributed'] === true) {
        choices.push('Re-Distribute Proposal Asset')
    }

    if (config['gora_dao']['participated_to_proposal'] === true && config['gora_dao']['proposal_is_activated'] === false) {
        choices.push('Withdraw Proposal Participation')
    } else if (config['gora_dao']['proposal_is_activated'] === false) {
        choices.push('Participate into Proposal')
    }
    if (config['gora_dao']['participated_to_proposal'] === true && config['gora_dao']['proposal_is_activated'] === true) {
        choices.push('Vote on Proposal')
    }

    choices.push('Help')
    choices.push('Back to Main Menu')

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'proposalOperation',
            message: 'Select a proposal operation:',
            choices: choices,
        },
    ]);

    switch (answers.proposalOperation) {
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
        case 'Re-Distribute Proposal Asset':
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
                await goraDaoDeployer.participateProposalContractAll();

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
        case 'Withdraw Proposal Participation':
            try {
                await goraDaoDeployer.participationWithdrawProposalContractAll();
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
                let { userIndex } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'userIndex',
                        message: 'Which user to vote for? (1-5):',
                    },
                ]);
                let { vote } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'vote',
                        message: 'What is the vote? (0: NO, 1:YES, 2: Abstain ):',
                    },
                ]);
                await goraDaoDeployer.voteProposalContract(Number(userIndex), Number(vote));
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
            await mainMenu(true);
            break;
        case 'Help':
            logger.info('GoraDAO Help | Proposals Operations Menu');
            logger.info('------------------------------------');
            logger.info(`
            +-----------------------+       +-----------------------------------+       +-----------------------------------+
            |                       |       |                                   |       |                                   |
            |  Create Proposal      +------->  Distribute Proposal Asset        +------->  Deploy/Update new Proposal       |
            |  Asset                |       |  to 5 test users                  |       |  contract                         |
            |                       |       |                                   |       |                                   |
            +-----------------------+       +-----------------------------------+       +-----------------------------------+
                                                                                            |
                                                                                            |
                                                                                            v
                                                                          +------------------------+       +---------------------------+
                                                                          |                        |       |                           |
                                                                          |  Configure Proposal    +------->  Participate/Withdraw     |
                                                                          |                        |       |  participation to/from    |
                                                                          +------------------------+       |  Proposal                 |
                                                                                                           |                           |
                                                                                                           +---------------------------+
                                                                                                                       |
                                                                                                                       |
                                                                                                                       v
                                                                                                           +---------------------------+
                                                                                                           |                           |
                                                                                                           |  Vote on Proposal         |
                                                                                                           |                           |
                                                                                                           +---------------------------+

            `);
            logger.info('Create GoraDAO Proposals Asset: Create the GoraDAO proposal asset');
            logger.info('Distribute Proposal Asset: Distribute the Proposal asset! System will automatically opts generated 5 test user accounts into proposal asset and tops them with Algos enough to pay for configured requirements for both participation and voting ');
            logger.info('Deploy New Proposal: Deploy the new Proposal contract');
            logger.info('Update Deployed Proposal: Update the deployed Proposal contract');
            logger.info('Configure Proposal: Configure the Proposal contract');
            logger.info('Participate into Proposal: Participate into the Proposal');
            logger.info('Withdraw Proposal Participation: Withdraw participation from the Proposal');
            logger.info('Vote on Proposal: Vote on the Proposal');

            await inquirer.prompt([
                {
                    type: 'input',
                    name: 'continue',
                    message: 'Press Enter to go back to menu...',
                },
            ]);
            break;

    }

    // Loop back to proposals operations menu unless going back to main menu
    if (answers.proposalOperation && answers.proposalOperation !== 'Back to Main Menu') {
        await proposalsOperations();
    }
    // Loop back to staking operations menu unless going back to main menu
    if (answers.stakingOperation && answers.stakingOperation !== 'Back to Main Menu') {
        await stakingOperations();
    }
}
async function stakingOperations() {
    let choices = [];
    if (!(Number(config['gora_dao']['staking_asa_id']) > 0) && config['gora_dao']['enforce_gora_token'] === false) {
        choices.push('Create GoraDAO Staking Asset')
    }
   
    if (config['gora_dao']['dao_staking_deployed'] === false) {
        choices.push('Deploy New Staking')
    } else {
        choices.push('Update Deployed Staking')
    }
    if (config['gora_dao']['dao_staking_deployed'] === true) {
        choices.push('Configure Staking')
    }
    if (config['gora_dao']['staking_is_activated'] === false) {
        choices.push('Activate Staking')
    } else if (config['gora_dao']['staking_is_activated'] === true) {
        choices.push('Stake into staking contract')
        //choices.push('Withdraw stake from staking contract')
    }
    if (config['gora_dao']['dao_staking_deployed'] === true && config['gora_dao']['staking_asa_distributed'] === false) {
        choices.push('Distribute Staking Asset')
    } else if (config['gora_dao']['dao_staking_deployed'] === true && config['gora_dao']['staking_asa_distributed'] === true) {
        choices.push('Re-Distribute Staking Asset')
        choices.push('Re-Distribute Staking Asset(App only)')
    }
    if (config['gora_dao']['proxy_staking_is_opted_in'] === false) {
        choices.push('Opt-in to Proxy Staking')
    } else if (config['gora_dao']['proxy_staking_is_opted_in'] === true) {
        choices.push('Check Opt-in to Proxy Staking')
    }
    
    if (config['gora_dao']['enforce_gora_token'] === true) {
        choices.push('Create NFT Staking TEST Assets')
    }




    choices.push('Help')
    choices.push('Back to Main Menu')

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'stakingOperation',
            message: 'Select a staking operation:',
            choices: choices,
        },
    ]);

    switch (answers.stakingOperation) {
        case 'Create GoraDAO Staking Asset':
            try {
                await goraDaoDeployer.createDaoStakingAsset();
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
        case 'Create NFT Staking TEST Assets':
            try {
                let { qty } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'qty',
                        message: 'How many testing NFT staking assets you need to create?',
                    },
                ]);
                await goraDaoDeployer.iterativeMintingTestNfts(Number(qty));
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
        case 'Deploy New Staking':
            try {
                await goraDaoDeployer.createStakingContract();
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
        case 'Update Deployed Staking':
            try {
                await goraDaoDeployer.updateStakingContract();
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
        case 'Configure Staking':
            try {
                await goraDaoDeployer.configureStakingContract();
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
        case 'Distribute Staking Asset':
            try {
                await goraDaoDeployer.sendStakingAssetTransaction();
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
        case 'Re-Distribute Staking Asset(App only)':
            try {
                await goraDaoDeployer.sendStakingAssetTransaction(true);
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
        case 'Re-Distribute Staking Asset':
            try {
                await goraDaoDeployer.sendStakingAssetTransaction();
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
        case 'Stake into staking contract':
            try {
                let { amount } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'amount',
                        message: 'What amount you want to stake?',
                    },
                ]);

                let finalAmount = Number(amount) * 1000000000 // e.g. to stake 5 Gora the amount will be 5000000000
                //await goraDaoDeployer.stakeStakingContract(Number(amount));
                await goraDaoDeployer.stakeProxyStakingContract(2, Number(finalAmount));
                //await goraDaoDeployer.stakeDirectProxyStakingContract(Number(amount));
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
        case 'Withdraw stake from staking contract':
            try {
                let { amount } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'amount',
                        message: 'What amount you want to stake?',
                    },
                ]);

                await goraDaoDeployer.stakeStakingContract(2, Number(amount));
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
        case 'Activate Staking':
            try {
                await goraDaoDeployer.activateStakingContract();
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
        case 'Opt-in to Proxy Staking':
        case 'Check Opt-in to Proxy Staking':
            try {
                await goraDaoDeployer.optinProxyStakingContract(2);
                //await goraDaoDeployer.optinProxyStakingContractTransactionAll();
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
        case 'Back to Main Menu':
            await mainMenu(true);
            break;
        case 'Help':
            logger.info('GoraDAO Help | Proposals Operations Menu');
            logger.info('------------------------------------');
            logger.info(`
            +-----------------------+       +-----------------------------------+       +-----------------------------------+
            |                       |       |                                   |       |                                   |
            |  Create Proposal      +------->  Distribute Proposal Asset        +------->  Deploy/Update new Proposal       |
            |  Asset                |       |  to 5 test users                  |       |  contract                         |
            |                       |       |                                   |       |                                   |
            +-----------------------+       +-----------------------------------+       +-----------------------------------+
                                                                                            |
                                                                                            |
                                                                                            v
                                                                          +------------------------+       +---------------------------+
                                                                          |                        |       |                           |
                                                                          |  Configure Proposal    +------->  Participate/Withdraw     |
                                                                          |                        |       |  participation to/from    |
                                                                          +------------------------+       |  Proposal                 |
                                                                                                           |                           |
                                                                                                           +---------------------------+
                                                                                                                       |
                                                                                                                       |
                                                                                                                       v
                                                                                                           +---------------------------+
                                                                                                           |                           |
                                                                                                           |  Vote on Proposal         |
                                                                                                           |                           |
                                                                                                           +---------------------------+

            `);
            logger.info('Create GoraDAO Proposals Asset: Create the GoraDAO proposal asset');
            logger.info('Distribute Proposal Asset: Distribute the Proposal asset! System will automatically opts generated 5 test user accounts into proposal asset and tops them with Algos enough to pay for configured requirements for both participation and voting ');
            logger.info('Deploy New Proposal: Deploy the new Proposal contract');
            logger.info('Update Deployed Proposal: Update the deployed Proposal contract');
            logger.info('Configure Proposal: Configure the Proposal contract');
            logger.info('Participate into Proposal: Participate into the Proposal');
            logger.info('Withdraw Staking Participation: Withdraw participation from the Proposal');
            logger.info('Vote on Proposal: Vote on the Proposal');

            await inquirer.prompt([
                {
                    type: 'input',
                    name: 'continue',
                    message: 'Press Enter to go back to menu...',
                },
            ]);
            break;

    }

    // Loop back to proposals operations menu unless going back to main menu
    if (answers.proposalOperation && answers.proposalOperation !== 'Back to Main Menu') {
        await proposalsOperations();
    }
    // Loop back to Stakings operations menu unless going back to main menu
    if (answers.stakingOperation && answers.stakingOperation !== 'Back to Main Menu') {
        await stakingOperations();
    }
}
async function mainMenu(isInteractive) {
    // Run deployer for account preparation and loading Mnemonics
    await goraDaoDeployer.runDeployer(isInteractive)
    console.log(` 
    .d8888b.                           8888888b.        d8888  .d88888b.  
    d88P  Y88b                          888  "Y88b      d88888 d88P" "Y88b 
    888    888                          888    888     d88P888 888     888 
    888         .d88b.  888d888 8888b.  888    888    d88P 888 888     888 
    888  88888 d88""88b 888P"      "88b 888    888   d88P  888 888     888 
    888    888 888  888 888    .d888888 888    888  d88P   888 888     888 
    Y88b  d88P Y88..88P 888    888  888 888  .d88P d8888888888 Y88b. .d88P 
     "Y8888P88  "Y88P"  888    "Y888888 8888888P" d88P     888  "Y88888P"  
                                                                           
                                                                           
                                                                           `);
    if (isInteractive) {
        // Main menu options
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select the operation to perform:',
                choices: [
                    'Tester Accounts Dispense',
                    'Tester Accounts Stats',
                    'Reset Configurations file',
                    'GoraDAO Operations',
                    'Proposals Operations',
                    'Staking Operations',
                    'Tester Accounts Recreate (optional! be careful!)',
                    'Help',
                    'Exit'
                ],
            },
        ]);
        // Main menu operations
        switch (answers.action) {
            case 'Tester Accounts Recreate (optional! be careful!)':
                // Assuming testAccountStats is a method in GoraDaoDeployer

                try {
                    let { recreate } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'recreate',
                            message: 'Are you sure you want to re-create the tester accounts? (y/n)',
                        },
                    ]);
                    if (recreate === 'y') {
                        await goraDaoDeployer.sendAllAlgosAndDeleteMnemonics();
                        await goraDaoDeployer.deployerReport();
                    } else {
                        logger.info('Tester accounts recreation cancelled')
                    }
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
            case 'Reset Configurations file':
                try {
                    await goraDaoDeployer.resetConfigFile();
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
            case 'Staking Operations':
                await stakingOperations();
                break;
            case 'Help':
                logger.info('GoraDAO Help | Main Operations Menu');
                logger.info('------------------------------------');
                //logger.info('Test flow: Dispense ino Tester accounts---> Go to GoraDAO Operations to continue!');
                logger.info(`
            +-------------------------------------------+       +--------------------------------+
            |                                           |       |                                |
            |  Dispense ino Tester accounts             |------>|  Go to GoraDAO Operations      |
            |                                           |       |         to continue!           |
            +-------------------------------------------+       +--------------------------------+
            
            `);
                logger.info('Tester Accounts Dispense: Dispense algos to tester accounts');
                logger.info('Tester Accounts Stats: Show tester accounts stats');

                logger.info('GoraDAO Operations: Perform GoraDAO operations');
                logger.info('Proposals Operations: Perform Proposals operations');
                logger.info('Tester Accounts Recreate (optional! be careful!): Recreate tester accounts');
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'continue',
                        message: 'Press Enter to go back to menu...',
                    },
                ]);
                break;

            case 'Exit':
                console.log('Exiting...');
                process.exit(0);
        }
        // Loop back to main menu unless exited
        await mainMenu(isInteractive);
    }
}

// Initialize and run the main menu
mainMenu(config.deployer['is_interactive']).catch(err => {
    console.error('An error occurred:', err);
    process.exit(1);
});
