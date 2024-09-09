# GoraDAO
### A new non-opinionated, dynamic approach to DAO


    .d8888b.                           8888888b.        d8888  .d88888b.  
    d88P  Y88b                          888  "Y88b      d88888 d88P" "Y88b 
    888    888                          888    888     d88P888 888     888 
    888         .d88b.  888d888 8888b.  888    888    d88P 888 888     888 
    888  88888 d88""88b 888P"      "88b 888    888   d88P  888 888     888 
    888    888 888  888 888    .d888888 888    888  d88P   888 888     888 
    Y88b  d88P Y88..88P 888    888  888 888  .d88P d8888888888 Y88b. .d88P 
     "Y8888P88  "Y88P"  888    "Y888888 8888888P" d88P     888  "Y88888P"  


| <img src="https://avatars.githubusercontent.com/u/96357480?s=400&u=f54a2fab0e5faaf6bccf57b993e0a28ca2102001&v=4" width="100"> <br>GoraDAO is developed, maintained, and implemented as GoraDAO service by [Gora](https://gora.io)!| <img src="https://uploads-ssl.webflow.com/646efe133ad1fe199a53f269/64e8a304831329ff7513f00b_poseNewWebsite01_2-p-800.png" width="170">|  
| -------- | ------- | 

This repository is a work in progress and contains Algorand TEAL smart contracts of GoraDAO, plus interactive CLI to test and operate it!

GoraDAO provides dynamic generation of Staking, NFT-Staking, Proposals and Vesting (optional for future development phase ) contracts via C2C calls and offers unique DAO features:

- Self-contained, decentralized, and permission-less lifecycle
- Interactive CLI
- Web interface provided by GoraNetwork as well
- 100% Sybil resistant
- 100% double-vote resistant (as per identity level on Algorand blockchain)
- Configurable Subscription to DAO and Participation to Proposals
- Configurable Voting
- Configurable Algo and BYOT for staking and fees
- Configurable NFT-Staking
- Full separation of concerns on staking and fees limits for proposals and voting to maintain 100% decentralization and permissionless system.
- Update and Delete can be disabled on Proposals, Staking and Vesting contracts (After development and community feedback)
- Configurable Vesting (future phase)
- Configurable Staking (Direct and delegated staking V3 contracts under one DAO)

A note on DAO processes:

- GoraDAO Proposal Proposers processes
  - Meet requirements (Minimum subscription fees in Algo and/or DAO Token)
  - Subscribe to DAO
  - Propose proposals
- GoraDAO Proposal Participants processes
  - Meet requirements (Minimum participation stakings and fees in Algo and/or DAO Token)
  - Participate in proposal (it's like registration for voting)
  - Cast vote
- GoraDAO managers processes:
  - Deploy DAO
  - Configure DAO
  - Distribute DAO token
- GoraDAO Staking managers processes:
  - Create Staking
  - Optionally create Staking Asset (OR enforce Gora token as staking asset)
  - Configure Staking
  - Activate Staking
  - Stake (direct staking or NFT staking)
  - Unstake
  - Claim
  - Distribute DAO token (Optional)

A note on threshold parameters structure:
Each proposal's behavior regarding activation for voting, the conclusion of voting, and such is controlled through some parameters during the proposal configuration ABI call:

- participation threshold: an array (tuple) of Uint64 integer numbers of expected participation count (e.g how many would participate in voting)
- vote threshold: an array (tuple) of Uint64 integer numbers, the same size as the participation threshold ( extra values will be ignored by smart contract), including voting thresholds for peer index of participation threshold (for example: if 250 participants then 150 votes are needed for the proposal to pass). 
- proposal allocations: an array (tuple) of Uint64 integer numbers, the same size as the participation threshold ( extra values will be ignored by smart contract), including allocation amounts for peer index of participation threshold (example: if 250 participants then 150 votes are needed for the proposal to pass and all 1000000 requested token are approved to be allocated for vesting)

Example: `
[250,150, 100]
[150,85, 50]
[1000000,750000, 500000]
`

Important note: On UI level these numbers should be asked from the user as percentages and there (based on the total amount) software should calculate the rounded integer numbers for each index on each parameter and then make the ABI call.

With this innovative approach, DAO proposals get more dynamic and proactive in the face of different participation behaviors from the community!

## Gora DAO Contracts: V1

GoraDAO contracts follow these principal designs:
- No static or hard-coded value
- All scenarios are created based on ABI calls to GoraDAO contracts
- There is one Proposal and one Vesting contract(future work) per Proposal to make the GoraDAO as decentralized and permission-less as possible!
- ABIs 100% compliant with ARC4
- No Update or Delete for Proposals after Locking
- No app opt-in or local state usage anywhere

As illustrated in the following diagram GoraDAO on-chain architecture is focused on integration and interoperability with existing working Gora smart contracts!

**Gora & GoraDAO on-chain architecture:**

```mermaid

graph TB
 
     subgraph Gora
        Gora_Main_Contract[Gora_Main_Contract]
       

        subgraph GoraDAO
            GoraDAO_Main((GoraDAO_Main))
            GoraDAO_Proposal((GoraDAO_Proposal))
            GoraDAO_Vesting[GoraDAO_Vesting]
            GoraDAO_Stake_Delegator[GoraDAO_Stake_Delegator]
        end
    end
      
      GoraDAO_Stake_Delegator((GoraDAO_Stake_Delegator)) --> Gora_Main_Contract


      GoraDAO_Main((GoraDAO_Main)) --> GoraDAO_Proposal
      GoraDAO_Main((GoraDAO_Main)) --> GoraDAO_Vesting
      GoraDAO_Main((GoraDAO_Main)) --> GoraDAO_Stake_Delegator
      GoraDAO_Proposal((GoraDAO_Proposal)) --> GoraDAO_Vesting
      GoraDAO_Stake_Delegator((GoraDAO_Stake_Delegator)) --> GoraDAO_Vesting



```
### Gora DAO Main Contract: V1

GoraDAO main contract, once deployed to a network, will be responsible for generating Staking, Proposals and Vesting Contracts(future work).
GoraNetwork deploys the GoraDAO main contract and owns managerial rights to it and optionally can assign a manager address to delegate the authority to another Algorand account address (probably a multisig for DAO governance).

Proposal contract create and configure ABI calls would create Proposal units (if all criteria is met by the call ARGs) and after that the Proposal creator account would be the manager of that Proposal unit and inherently can assign and delegate this to another account!
The scope of authority Proposal manager account has is not broad and is only to maintain 100% non-custodial, decentralized and permission-less DAO protocol, nothing more! For example, Proposal manager cannot delete proposal and just can deactivate it and withdraw from it! Delete and update are disabled on Proposals as well as their peer vesting contracts (future work)!



Future implementation idea: Add configuration to GoraDAO in a way that it should only come from a child proposal to be approved sothat there can be Proposals in the future to tune GoraDAO further more or change the settings on that! E.g. the required Gora amount to create a Proposal!

```mermaid

graph LR
 
      subgraph GoraDAO Main
            GoraDAO_Main[GoraDAO_Main_ABI]
            DAO_Create[DAO_Create]
            DAO_Update[DAO_Update]
            DAO_Config[DAO_Config]
            DAO_Lock[DAO_Lock]
            DAO_Create_Asset[DAO_Create_Asset]
            Update_Manager_address[update_manager_address]
            DAO_Subscribe[dao_subscribe]
            DAO_Unsubscribe[dao_unsubscribe]
            %% Create_Proposal[create_proposal]
            %% Configure_Proposal[config_proposal]
            %% Update_Proposal_Manager_address[update_proposal_manager_address]
            %% Proposal_Participate[proposal_participate]
            %% Proposal_Withdraw_Participation[proposal_withdraw_participation]
            %% Activate_Voting[activate_proposal]
            %% Proposal_Vote[proposal_vote]
            %% Proposal_Vesting_Stats[proposal_vesting_stats]
            %% Configure_Vesting[configure_vesting]
            %% Force_Close_Proposal[close_proposal]

            %% Create_Staking[create_staking]
            %% Update_Staking[Update_Staking]
            %% Configure_Staking[config_staking]
            %% Update_Staking_Manager_address[update_staking_manager_address]
            %% Activate_Staking[activate_staking]

       
        end
      
subgraph GoraDAO Proposal


      GoraDAO_Main[GoraDAO_Main_ABI] ---> Create_Proposal
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Configure_Proposal
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Participate
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Withdraw_Participation
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Activate_Voting
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Vote
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Vesting_Stats
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Configure_Vesting
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Force_Close_Proposal

  
end

subgraph GoraDAO Staking


    

      GoraDAO_Main[GoraDAO_Main_ABI] ---> Create_Staking
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Update_Staking
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Lock_Staking
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Create_Staking_Asset
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Configure_Staking
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Activate_Staking
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Staking_Stake
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Staking_Unstake
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Staking_Claim
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Staking_Register_NFT
end
```
### GoraDAO Main Contract Methods

- config_dao: Initializes DAO! Should be sent by owner (Creator) of DAO! Returns the manager address!
- subscribe_dao: Subscribes an Algorand account into GoraDAO! Returns total number of members!
- unsubscribe_dao: Unsubscribes an Algorand account from GoraDAO! Returns total number of members!
- write_source_box: Writes the compiled teal source of proposal to a corresponding box - proposal_approval or proposal_clear.
- create_proposal: Creates a new Proposal contract! Returns the Proposal contract ID!
- update_proposal: Updates a Proposal smart contract and returns application ID.
- config_proposal: Configures a Proposal contract! Returns the Proposal contract ID!
- proposal_participate: Participates a member to a Proposal! Returns the Proposal contract ID!
- proposal_withdraw_participate: Withdraws a member participation from a Proposal! Returns the Proposal contract ID!
- proposal_vote: Optionally Votes to a Proposal! Returns the Proposal contract ID!
activate_proposal: Activates a Proposal! Returns the Proposal contract ID!
- close_proposal: Force closes a Proposal contract as last resort. Returns the Proposal contract ID!
```mermaid
graph LR
    GoraDAO_Main[GoraDAO Main Contract]
    GoraDAO_Main --> config_dao[config_dao]
    GoraDAO_Main --> subscribe_dao[subscribe_dao]
    GoraDAO_Main --> unsubscribe_dao[unsubscribe_dao]
    GoraDAO_Main --> write_source_box[write_source_box]
    GoraDAO_Main --> create_proposal[create_proposal]
    GoraDAO_Main --> update_proposal[update_proposal]
    GoraDAO_Main --> config_proposal[config_proposal]
    GoraDAO_Main --> proposal_participate[proposal_participate]
    GoraDAO_Main --> proposal_withdraw_participate[proposal_withdraw_participate]
    GoraDAO_Main --> proposal_vote[proposal_vote]
    GoraDAO_Main --> activate_proposal[activate_proposal]
    GoraDAO_Main --> close_proposal[close_proposal]
```

## GoraDAO CLI
GoraDAO CLI is a powerful conversational CLI that provides easy implementation, deployment, and management of GoraDAO as an independent DAO. This feature is both useful for domestic development and product lifecycle for GoraNetworks implementation of GoraDAO and also for after open sourcing GoraDAO to be used by anyone to implement a DAO, leading to more adoption of technology.
### CLI First Look
![Screenshot 2024-08-15 at 18 11 04](https://github.com/user-attachments/assets/ae40e572-b51b-45fa-bc6b-4dc3542c5d74)

### Dispense your accounts
Upon first run , neccessary Algorand account menmonics are created and writen under local copy ofn repository on user file system to be used in future with CLI. Feel free to change any of those before dispensing to it.
Created accounts include:
- Menmonic0: GoraDAO Admin user
- Menmonic1: GoraDAO proposals admin
- Menmonic2: GoraDAO user1
- Menmonic3: GoraDAO user2
- Menmonic4: GoraDAO user3
- Menmonic5: GoraDAO user4
- Menmonic6: GoraDAO user5
- Menmonic7: GoraDAO Staking Admin
  
And then admin user dispenses into GoraDAO Menmonics:

![Screenshot 2024-09-09 at 12 28 49](https://github.com/user-attachments/assets/6bff058e-ed22-4a1e-906f-c03629c2ff2d)


## GoraDAO MAIN Operations CLI Screen cast 
![Screenshot 2024-03-03 at 18 48 02](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/092eed58-efb8-43c9-8a39-f7948dbed0fb)

![Screenshot 2024-03-02 at 16 42 39](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/42142974-7778-4308-9e1d-94a5c64b346e)

![Screenshot 2024-03-02 at 16 37 26](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/cefa137d-c6b1-4c46-83ac-0f54b1f22c50)

![Screenshot 2024-03-02 at 16 38 37](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/5e6f2f97-9565-4836-8b02-a5cbd7500d2a)

![Screenshot 2024-03-02 at 16 39 15](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/59d0a374-47f8-4d3d-9af9-12c3f5bbef0c)

![Screenshot 2024-03-02 at 16 39 46](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/d0fd02e1-7ac8-4c75-8312-4a0473a1a60b)

### Gora DAO Proposal Contract: V1
GoraDAO Proposal contracts are created from an ABI call to main contract and constitute an inner transaction C2C call to create Proposal contract!

The phases of a proposal lifecycle are:

- Creation
- Configuration
- Update (Before Lock)
- Participation
- Voting activation (Locks)
- Voting
- Closure
- Force Closure


Important note: Force_Close_Proposal is a multi step process , only designed for extreme emergency cases where something is agreed by almost everyone to go wrong and therefore grants from owner, manager_address and also Gora main contract manager are needed to be effective and close the Proposal and archive it! There are no limitations on creating a new Proposal with identical specifications though!

The activate_proposal is a manual override in case of min_participation is not met! The voting activation handled in GoraDAO:
- Time based activation in case that min-participation is met!
- Min participation is met before start time---> activate_proposal can activate (This does not change the voting ending conditions including end_time and all_voted).

Note : Because the vesting(future work) is still an open topic in GoraNetwork, Configure_Vesting method is not detailed in ABI or developed in TEAL code yet!

Some methods have constraint of being in same transaction group as a call to identical method name with different signature to either GoraDAO main or vesting contracts! These methods are:

- Configure_Proposal
- Configure_Vesting
- Proposal_Participate
- Activate_Voting
- Proposal_Withdraw_Participation
- Force_Close_Proposal

```mermaid

graph LR
 
      subgraph GoraDAO Proposal
            GoraDAO_Proposal[GoraDAO_Proposal_ABI]
            Proposal_Create[create_proposal]
            Update_Manager_address[update_manager_address]
            Configure_Proposal[config_proposal]
            Configure_Vesting[config_vesting]
            Activate_Voting[activate_proposal]
            Proposal_Participate[proposal_participate]
            Proposal_Withdraw_Participation[proposal_withdraw_participation]
            Proposal_Vote[proposal_vote]
            Force_Close_Proposal[close_proposal]
       
        end
      

      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Proposal_Create
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Update_Manager_address

      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Configure_Proposal
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Configure_Vesting
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Activate_Voting
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Proposal_Participate
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Proposal_Withdraw_Participation
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Proposal_Vote
      GoraDAO_Proposal[GoraDAO_Proposal_ABI] ---> Force_Close_Proposal
 

```

### GoraDAO Proposals Contract Methods
- create_proposal: Creates a new Proposal contract! Returns the Proposal contract ID!
- optin_proposal_asset: Signal to optin to proposal asset.
- update_proposal: Updates an existing Proposal contract! Returns the Proposal contract ID!
- config_proposal: Configures a Proposal contract! Returns the Proposal contract ID!
- update_manager_address: Updates Proposal manager address! Returns new manager address.
- activate_proposal: Activates a Proposal voting! Returns the Proposal contract ID!
- close_proposal: Force closes a Proposal contract as a last resort. Returns the Proposal contract ID!
- proposal_participate: Participates with a member account into a Proposal! Returns the participating member's account address!
- proposal_withdraw_participate: Withdraws participation of a member account from a Proposal! Returns the withdrawing member's account address!
- proposal_vote: Votes for a Proposal! Returns the voting member's account address concatenated with vote!



```mermaid

graph LR
    GoraDAO_Proposals[GoraDAO Proposals Contract]
    GoraDAO_Proposals --> create_proposal_P[create_proposal]
    GoraDAO_Proposals --> optin_proposal_asset[optin_proposal_asset]
    GoraDAO_Proposals --> update_proposal_P[update_proposal]
    GoraDAO_Proposals --> config_proposal_P[config_proposal]
    GoraDAO_Proposals --> update_manager_address[update_manager_address]
    GoraDAO_Proposals --> activate_proposal_P[activate_proposal]
    GoraDAO_Proposals --> close_proposal_P[close_proposal]
    GoraDAO_Proposals --> proposal_participate_P[proposal_participate]
    GoraDAO_Proposals --> proposal_withdraw_participate_P[proposal_withdraw_participate]
    GoraDAO_Proposals --> proposal_vote_P[proposal_vote]

```

## GoraDAO Proposals & Voting Operations CLI Screen cast 

![Screenshot 2024-03-02 at 16 40 35](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/9bd0f0aa-7738-40c2-b2ca-42a1fc4c9fb5)

![Screenshot 2024-03-02 at 16 41 17](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/ce4b540b-9d36-44e1-8aae-d5123446d22d)

![Screenshot 2024-03-02 at 16 44 45](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/bb5bdb42-e4fa-49e1-ab7b-a2f63d9a1ab6)

![Screenshot 2024-03-02 at 16 46 44](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/f468e262-681a-4f68-b952-99bb8fdc484f)

![Screenshot 2024-03-02 at 18 46 01](https://github.com/GoraNetwork/gora-dao-smartcontracts/assets/1900448/ecf4c4be-1c92-46d0-8653-8da684942b1f)


### Gora DAO Staking Contract: V3
GoraDAO Staking contracts are created from an ABI call to DAO main contract and constitute an inner transaction C2C call to create Staking contract. Config, Activate, Stake, Unstake, Claim, Register NFT are called concurrently with the same method name to GoraDAO main contract and staking V3 contracts!

There are types to staking contracts in GoraDAO:
- Delegated Staking
- NFT Staking

The phases of a staking lifecycle are:

- Creation
- Configuration
- Update (before Lock)
- Activate/Lock
- Stake
- Unstake
- Claim



Note : Because the vesting(future work) is still an open topic in GoraNetwork, Configure_Vesting method is not detailed in ABI or developed in TEAL code yet!

Some methods have constraint of being in same transaction group as a call to identical method name with different signature to either GoraDAO main or vesting contracts(future work)! These methods are:

- Create_Staking (Delegated Staking creation method called to MAIN and STAKING V3 contracts in one atomic group)
- Update_Staking (Delegated Staking update method called to MAIN and STAKING V3 contracts in one atomic group)
- Configure_Staking (Delegated Staking config method called to MAIN and STAKING V3 contracts in one atomic group)
- Activate_Staking (Delegated Staking activation method called to MAIN and STAKING V3 contracts in one atomic group)
- Staking_Stake (Delegated Staking stake method called to MAIN and STAKING V3 contracts in one atomic group)
- Staking_Unstake (Delegated Staking unstake method called to MAIN and STAKING V3 contracts in one atomic group)

```mermaid

graph LR
 
      subgraph GoraDAO Staking
            GoraDAO_Staking[GoraDAO_Staking_ABI]
            Staking_Create[create_staking]
            Staking_Update[update_staking]
            Update_Manager_address[update_manager_address]
            Configure_Staking[config_staking]
            Activate_Staking[activate_staking]
            Staking_Stake[staking_stake]
            Staking_Unstake[staking_unstake]
            Staking_Claim[staking_claim]
            Register_NFT[register_nft]
        end
      

      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Staking_Create
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Staking_Update
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Update_Manager_address

      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Configure_Staking
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Activate_Staking
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Staking_Stake
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Staking_Unstake
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Staking_Claim
      GoraDAO_Staking[GoraDAO_Staking_ABI] ---> Register_NFT
 

```

### GoraDAO Staking Contract Methods

- create_staking: Creates a new Staking contract! Returns the Staking contract ID!
  - DAO ABI call:
  ```javascript
  {
            "name": "create_staking",
            "description": "Creates a new Staking contract! Returns the Staking contract ID!",
            "args": [
                {
                    "type": "pay",
                    "name": "payment_transaction",
                    "description": "Payment from Proposer to DAO for Staking fees and initiation MBRs!"
                },
                {
                    "type": "uint64",
                    "name": "asset_reference",
                    "description": "DAO Staking token ref"
                },
                {
                    "type": "uint64",
                    "name": "asset_reference",
                    "description": "DAO token ref"
                },
                {
                    "type": "string",
                    "name": "staking_name",
                    "description": "DAO Staking title"
                },
                {
                    "type": "string",
                    "name": "staking_description",
                    "description": "DAO Staking description"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },
  ```
  - Staking ABI call:
  ```javascript
   {
            "name": "create_staking",
            "description": "Creates a new Staking contract! Returns the Staking contract ID!",
            "args": [
                {
                    "type": "uint64",
                    "name": "dao_asset_reference",
                    "description": "DAO Main asset (DAO) ID"
                },
                {
                    "type": "uint64",
                    "name": "staking_asset_reference",
                    "description": "Staking asset ID"
                },
                {
                    "type": "string",
                    "name": "staking_name",
                    "description": "Staking title"
                },
                {
                    "type": "string",
                    "name": "staking_description",
                    "description": "Staking description"
                }
            ],
            "returns": {
                "type": "address"
            }
        },
  ```
- update_staking: Updates a new Staking contract (Before it's Locked)! Returns the Staking contract ID!
  - DAO ABI Call
  ```javascript
   {
            "name": "update_staking",
            "args": [
                {
                    "type": "pay",
                    "name": "payment_transaction",
                    "description": "Payment from Staking to DAO for Proposal fees and initiation MBRs!"
                },
                {
                    "type": "application",
                    "name": "staking_app_ref",
                    "description": "Staking application  to be referenced"
                },
                {
                    "type": "uint64",
                    "name": "staking_app_id",
                    "description": "Staking application  ID to be updated"
                },
                {
                    "type": "address",
                    "name": "member_reference",
                    "description": "DAO member account reference (Staking manager)"
                },
                {
                    "type": "uint64",
                    "name": "asset_reference",
                    "description": "DAO Staking token ID"
                }
            ],
            "returns": {
                "type": "uint64"
            },
            "desc": "Updates a Staking smart contract and returns application ID"
        }

  ```
  - Staking ABI Call
  ```javascript
   {
            "name": "update_staking",
            "description": "Updates an existing Staking contract! Returns the Staking contract ID!",
            "args": [],
            "returns": {
                "type": "address"
            }
        },

  ```
- config_staking: Configures a Staking contract! Returns the Staking contract ID!
  - DAO ABI Call
  ```javascript
    {
            "name": "config_staking",
            "description": "Configures a Staking contract! Returns the Staking contract ID!",
            "args": [
                {
                    "type": "pay",
                    "name": "payment_transaction",
                    "description": "Payment from Staking to DAO for fees and Staking MBRs!"
                },
                {
                    "type": "axfer",
                    "name": "dao_asset_transfer_transaction",
                    "description": "Asset transfer transaction to deposit DAO token (E.g. Gora)!"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },
  

  ```
  - Staking ABI Call
  ```javascript
  {
            "name": "config_staking",
            "description": "Configures a Staking contract! Returns the Staking contract ID!",
            "args": [
                {
                    "type": "pay",
                    "name": "payment_transaction",
                    "description": "Payment from Staking manager to DAO for fees and Staking configuration MBRs!"
                },
                {
                    "type": "(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)",
                    "name": "config_params",
                    "description": "min_algo, min_token, duration, min_duration, commission_token, commission_algo, fee_token, fee_algo, incentives_token,incentives_algo,type, incentives_duration, return_token, return_algo,incentives_eligibility"
                },
                {
                    "type": "string",
                    "name": "name",
                    "description": "DAO Staking name"
                },
                {
                    "type": "string",
                    "name": "description",
                    "description": "DAO Staking description"
                },
                {
                    "type": "string",
                    "name": "url",
                    "description": "DAO Staking URL"
                },
                {
                    "type": "string",
                    "name": "banner",
                    "description": "DAO Staking banner image URL"
                },
                {
                    "type": "uint64",
                    "name": "v2_main_app_id",
                    "description": "V2 main app ID"
                },
                {
                    "type": "uint64",
                    "name": "v2_vesting_app_id",
                    "description": "V2 vesting app ID"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },

  ```

- register_nft: Registers an NFT to a Staking contract! Returns the NFT ID!
  - Staking ABI Call
  ```javascript
  {
            "name": "register_nft",
            "description": "Register staking NFT!",
            "args": [
                {
                    "type": "uint64",
                    "name": "staking_nft",
                    "description": "The staking NFT asset"
                },
                {
                    "type": "uint64",
                    "name": "staking_nft_value",
                    "description": "The Staking token value of the staking NFT "
                }
            ],
            "boxes": [
                {
                    "name": "manager_reference",
                    "description": "Dynamic box ref per member account address"
                },
                {
                    "name": "staking_account",
                    "description": "Dynamic box per staking account (as key) and staking amount (as value)"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },

  ```
- activate_staking: Activates a Staking contract, open for staking! Returns the Staking contract ID!
  - DAO ABI Call
  ```javascript
  {
            "name": "activate_staking",
            "description": "Activates staking contract!",
            "args": [],
            "returns": {
                "type": "uint64"
            }
        },

  ```
  - Staking ABI Call
  ```javascript
    {
            "name": "activate_staking",
            "description": "Activates a Staking! Returns the Staking contract ID!",
            "args": [],
            "returns": {
                "type": "uint64"
            }
        }

  ```
- staking_stake: Delegates a user account to staking! Returns the staking member's account address!
  - DAO ABI Call
  ```javascript
     {
            "name": "stake",
            "description": "Stake into staking contract!",
            "args": [
                {
                    "type": "pay",
                    "name": "payment_transaction",
                    "description": "Payment from participants to DAO for fees and participation MBRs!"
                },
                {
                    "type": "axfer",
                    "name": "asset_transfer_transaction",
                    "description": "Asset transfer transaction to send DAO Token for fees!"
                }
                
            ],
            "returns": {
                "type": "uint64"
            }
        },

  ```
  - Staking ABI Call
  ```javascript
  {
            "name": "stake",
            "description": "Stakes in Staking contract! Returns the staking member's account address concatenated with staked amount!",
            "args": [
                {
                    "type": "pay",
                    "name": "stake_transaction",
                    "description": "Pay transaction to send staked Algos!"
                },
                {
                    "type": "axfer",
                    "name": "stake_axfer_transaction",
                    "description": "Axfer from Staking participant for staking token!"
                },
                {
                    "type": "uint64",
                    "name": "nft asa ID",
                    "description": "The staking NFT asset ID"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },
  

  ```
- staking_claim: Claims the staking rewards! Returns the claiming member's account address!
  - Staking ABI Call
  ```javascript
  {
            "name": "user_claim",
            "description": "Claims pending rewards!",
            "args": [
                {
                    "type": "uint64",
                    "name": "NFT_ASA_ID",
                    "description": "NFT ASA ID"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        }

  ```
- staking_unstake: Undelegates a user account from staking! Returns the withdrawing member's account address!
  - DAO ABI Call
  ```javascript
    {
            "name": "unstake",
            "description": "Un-stakes from Staking contract! Returns the staking member's account address concatenated with un-staked amount!",
            "args": [
                {
                    "type": "uint64",
                    "name": "amount_algo",
                    "description": "Amount to be un-staked"
                },
                {
                    "type": "uint64",
                    "name": "amount_token",
                    "description": "Token Amount to be un-staked"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },

  ```
  - Staking ABI Call
  ```javascript
    {
            "name": "unstake",
            "description": "Un-stakes from Staking contract! Returns the staking member's account address concatenated with un-staked amount!",
            "args": [
                {
                    "type": "uint64",
                    "name": "amount_algo",
                    "description": "Amount to be un-staked"
                },
                {
                    "type": "uint64",
                    "name": "amount_token",
                    "description": "Token Amount to be un-staked"
                },
                {
                    "type": "uint64",
                    "name": "NFT_ID",
                    "description": "NFT ASA ID to unstake"
                }
            ],
            "returns": {
                "type": "uint64"
            }
        },

  ```


```mermaid

graph LR
    GoraDAO_Staking[GoraDAO Staking Contract]
    GoraDAO_Staking --> create_Staking[create_staking]
    GoraDAO_Staking --> optin_staking_asset[optin_staking_asset]
    GoraDAO_Staking --> update_staking[update_staking]
    GoraDAO_Staking --> config_staking[config_config]
    GoraDAO_Staking --> update_manager_address[update_manager_address]
    GoraDAO_Staking --> activate_staking_P[activate_staking]
    GoraDAO_Staking --> staking_claim[staking_claim]
    GoraDAO_Staking --> staking_stake[staking_stake]
    GoraDAO_Staking --> staking_unstake[staking_unstake]
    GoraDAO_Staking --> register_nft[register_nft]

```






## GoraDAO NFT-Staking Operations CLI Screen cast 

 ![Screenshot 2024-08-16 at 15 47 41](https://github.com/user-attachments/assets/1abe892b-aa1a-4b0b-bef8-da5d77cacd0f)

![Screenshot 2024-08-16 at 15 47 52](https://github.com/user-attachments/assets/1ef9050c-7da5-4026-af29-fdfc326eb691)

![Screenshot 2024-08-16 at 16 26 10](https://github.com/user-attachments/assets/2184426f-db06-4a43-8a80-d878de0141f5)

![Screenshot 2024-08-16 at 16 29 27](https://github.com/user-attachments/assets/a82d90b5-3a1e-40ab-86c5-9fbc792616c4)

![Screenshot 2024-09-02 at 19 06 28](https://github.com/user-attachments/assets/1e875b9c-31a1-4d5d-aeb7-483a53ae9087)

![Screenshot 2024-09-02 at 16 51 12](https://github.com/user-attachments/assets/81a6c942-11b6-42fa-9b2d-001c96d3f83a)

![Screenshot 2024-09-01 at 19 18 45](https://github.com/user-attachments/assets/56d9f6ec-79b5-4188-98ff-eee866f24a4c)
![Screenshot 2024-09-02 at 14 56 02](https://github.com/user-attachments/assets/a2194a68-6070-42cb-9cb1-4bda66f9448f)
![Screenshot 2024-09-09 at 13 08 39](https://github.com/user-attachments/assets/f7318993-a2f2-45cb-9856-5640deae9614)





