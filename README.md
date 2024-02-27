# gora-dao-smartcontracts

#### GoraDAO is Gora Network's DAO system!

(WIP!) This repository contains Algorand AVM smart contracts of GoraDAO!

GoraDAO uses dynamic generation of Proposals and Vesting (optional ) contracts via C2C calls and brings unique features onto the DAO technology:

- Optional Vesting (future phase)
- Optional Staking
- Configurable Voting
- Configurable Vesting (future phase)
- Configurable Algo and/or BYOT for staking

A note on thresholds structure:

`[100,100,51]` is a threshold scenario and is consisted of 3 unsigned integers between 0-100! First is threshold of participation , second is the percentage of vesting application and third is the required percentage for approval! Gora proposal accepts array of this array as array of voting scenarios depending of participation percentage!

This lets a proposal to continue operation and go to vote even if the originally anticipated participation has not occurred! This can have either the same or different allocations and required approval percentages!

Example: `[[100,100, 52],[80, 70, 70], [60, 50, 70]]`

With this innovative approach DAO proposals get more dynamic and proactive in the face of different participation behaviors from community!

## Gora DAO Contracts: V1

GoraDAO contracts follow these principal designs:
- No static or hard coded value
- All scenarios are created based on ABI calls to GoraDAO contracts
- There are one Proposal and one Vesting contract(future work) per Proposal to make the GoraDAO as decentralized and permission-less as possible!
- ABIs complying to ARC4
- No Update or Delete for Proposals
- No app opt-in or local state usage anywhere

As illustrated in following diagram GoraDAO on-chain architecture is focused on integration and interoperability with existing working Gora smart contracts!

**Gora & GoraDAO on-chain architecture:**

```mermaid

graph TB
 
     subgraph Gora
        Gora_Main_Contract[Gora_Main_Contract]
        Gora_Vesting[Gora_Vesting]
        Gora_Stake_Delegator[Gora_Stake_Delegator]

        subgraph GoraDAO
            GoraDAO_Main((GoraDAO_Main))
            GoraDAO_Proposal((GoraDAO_Proposal))
            GoraDAO_Vesting((GoraDAO_Vesting))
        end
    end
      
      Gora_Main_Contract((Gora_Main_Contract)) --> Gora_Vesting
      Gora_Main_Contract((Gora_Main_Contract)) --> Gora_Stake_Delegator
      Gora_Vesting((Gora_Vesting)) --> Gora_Stake_Delegator

      GoraDAO_Main((GoraDAO_Main)) --> GoraDAO_Proposal
      GoraDAO_Main((GoraDAO_Main)) --> GoraDAO_Vesting
      GoraDAO_Proposal((GoraDAO_Proposal)) --> GoraDAO_Vesting
      GoraDAO_Vesting((GoraDAO_Vesting)) --> Gora_Stake_Delegator


```
### Gora DAO Main Contract: V1

GoraDAO main contract, once deployed to a network, will be responsible for generating Proposal units, consisted of a Proposal and a Vesting Contract(future work) dedicated to that proposal case! This design is to take permission-less and decentralization to the max for GoraDAO!
GoraNetwork deploys the GoraDAO main contract and owns managerial rights to it and optionally can assign a manager address to delegate the authority to another Algorand account address!

Proposal contract create and configure ABI calls would create Proposal units (if all criteria is met by the call ARGs) and after that the Proposal creator account would be the manager of that Proposal unit and inherently can assign and delegate this to another account!
The scope of authority Proposal manager account has is not broad and is only to maintain 100% non-custodial, decentralized and permission-less DAO protocol, nothing more! For example, Proposal manager cannot delete proposal and just can deactivate it and withdraw from it! Delete and update are disabled on Proposals as well as their peer vesting contracts (future work)!

The phases of a proposal lifecycle are:

- Creation
- Configuration
- Participation
- Voting activation
- Voting
- Closure
- Force Closure


Important note: Force_Close_Proposal is a multi step process , only designed for extreme emergency cases where something is agreed by almost everyone to go wrong and therefore grants from owner, manager_address and also Gora main contract manager are needed to be effective and close the Proposal and archive it! There are no limitations on creating a new Proposal with identical specifications though!

The activate_proposal is a manual override in case of min_participation is not met! The voting activation handled in GoraDAO:
- Time based activation in case that min-participation is met!
- Min participation is met before start time---> activate_proposal can activate (This does not change the voting ending conditions including end_time and all_voted).

Note : Because the vesting(future work) and staking contracts architecture is still an open topic in GoraNetwork, Configure_Vesting method is not detailed in ABI or TEAL code yet!

IDEA: Add configuration to GoraDAO in a way that it should only come from a child proposal to be approved sothat there can be Proposals in the future to tune GoraDAO further more or change the settings on that! E.g. the required Gora amount to create a Proposal!

```mermaid

graph TB
 
      subgraph GoraDAO Main
            GoraDAO_Main[GoraDAO_Main_ABI]
            DAO_Init[dao_init]
            Update_Manager_address[update_manager_address]
            DAO_Subscribe[dao_subscribe]
            DAO_Unsubscribe[dao_unsubscribe]
            Create_Proposal[create_proposal]
            Configure_Proposal[config_proposal]
            Proposal_Participate[proposal_participate]
            Proposal_Withdraw_Participation[proposal_withdraw_participation]
            Activate_Voting[activate_proposal]
            Proposal_Vote[proposal_vote]
            Proposal_Vesting_Stats[proposal_vesting_stats]
            Configure_Vesting[configure_vesting]
            Force_Close_Proposal[close_proposal]
       
        end
      

      GoraDAO_Main[GoraDAO_Main_ABI] ---> DAO_Init
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Update_Manager_address
      GoraDAO_Main[GoraDAO_Main_ABI] ---> DAO_Subscribe
      GoraDAO_Main[GoraDAO_Main_ABI] ---> DAO_Unsubscribe

      GoraDAO_Main[GoraDAO_Main_ABI] ---> Create_Proposal
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Configure_Proposal
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Participate
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Withdraw_Participation
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Activate_Voting
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Vote
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Proposal_Vesting_Stats
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Configure_Vesting
      GoraDAO_Main[GoraDAO_Main_ABI] ---> Force_Close_Proposal
 

```
### Gora DAO Proposal Contract: V1
GoraDAO Proposal contracts are created from an ABI call to main contract and constitute an inner transaction C2C call to create Proposal contract!

Some methods have constraint of being in same transaction group as a call to identical method name with different signature to either GoraDAO main or vesting contracts! These methods are:

- Configure_Proposal
- Configure_Vesting
- Proposal_Participate
- Activate_Voting
- Proposal_Withdraw_Participation
- Force_Close_Proposal

```mermaid

graph TB
 
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

## GoraDAO Main Contract Methods

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
``` Mermaid
graph TD
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
## GoraDAO Proposals Contract Methods
- create_proposal: Creates a new Proposal contract! Returns the Proposal contract ID!
- optin_proposal_asset: Signal to optin to proposal asset.
- update_proposal: Updates an existing Proposal contract! Returns the Proposal contract ID!
- config_proposal: Configures a Proposal contract! Returns the Proposal contract ID!
- update_manager_address: Updates Proposal manager address! Returns new manager address.
- activate_proposal: Activates a Proposal voting! Returns the Proposal contract ID!
- close_proposal: Force closes a Proposal contract as last resort. Returns the Proposal contract ID!
- proposal_participate: Participates with a member account into a Proposal! Returns the participating member's account address!
- proposal_withdraw_participate: Withdraws participation of a member account from a Proposal! Returns the withdrawing member's account address!
- proposal_vote: Votes for a Proposal! Returns the voting member's account address concatenated with vote!

``` Mermaid
graph TD
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