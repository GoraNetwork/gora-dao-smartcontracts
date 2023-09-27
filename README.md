# gora-dao-smartcontracts

#### GoraDAO is Gora Network's DAO system!

(WIP!) This repository contains Algorand AVM smart contracts of GoraDAO!

GoraDAO re-uses the existing Gora contracts as much as possible for sake of interoperability and better integration but for that purpose the TEAL source code (compiled from higher level languages) must be optimized and undergo some slight changes to be completely deployable within GoraDAO process, operations and logic!


## Gora Existing Contracts: V2

### Gora Vesting Contracts: V2
The Vesting contract in GoraNetwork is designed to manage the vesting schedules of tokens for users. It allows the creation of vesting parameters, including setting up a manager's address and defining time constraints for vesting. Users can opt into assets, vest tokens according to a specified schedule, and claim vested tokens when the time is right. The contract also integrates with the StakeDelegator, enabling users to stake their vested tokens to the delegator or withdraw them. Managers have the authority to update time constraints, change the manager's address, and manage a whitelist of apps that can interact with the vesting system. This contract ensures that tokens are vested and claimed in a secure and time-bound manner, reinforcing trust and transparency in the GoraNetwork's token distribution process.

These passages provide a high-level overview of the roles of the StakeDelegator and Vesting contracts in the GoraNetwork system. The exact functionalities and intricacies would be better understood by diving deeper into the contract code and the broader GoraNetwork architecture.



```mermaid

graph TB
    subgraph Vesting
        create[create]
        update_time_constraints[update_time_constraints]
        update_manager_address[update_manager_address]
        optin_asset[optin_asset]
        vest_tokens[vest_tokens]
        claim_vesting[claim_vesting]
        stake_to_delegator[stake_to_delegator]
        withdraw_from_delegator[withdraw_from_delegator]
        add_whitelisted_app[add_whitelisted_app]
        remove_whitelisted_app[remove_whitelisted_app]
    end

  

    Owner((Owner)) ---> create
    Manager((Manager)) ---> update_time_constraints
    Manager((Manager)) ---> update_manager_address
    User((User)) ---> optin_asset
    User((User)) ---> vest_tokens
    User((User)) ---> claim_vesting
    User((User)) ---> stake_to_delegator
    User((User)) ---> withdraw_from_delegator
    Manager((Manager)) ---> add_whitelisted_app
    Manager((Manager)) ---> remove_whitelisted_app
```

```mermaid
sequenceDiagram
participant User as User
participant Vesting as Vesting

Owner->>Vesting: create(manager_address, max_start, min_timeframe, max_timeframe)
Vesting-->>Owner: void

Manager->>Vesting: update_time_constraints(max_start, min_timeframe, max_timeframe)
Vesting-->>Manager: void

Manager->>Vesting: update_manager_address(new_manager_address)
Vesting-->>Manager: void

User->>Vesting: optin_asset(algo_xfer, asset, main_app_id, main_app_addr)
Vesting-->>User: void

User->>Vesting: vest_tokens(algo_xfer, token_xfer, vest_to, start_time, time_to_vest)
Vesting-->>User: void

User->>Vesting: claim_vesting(vestee, asset_ref)
Vesting-->>User: void

User->>Vesting: stake_to_delegator(delegator, vestee, main_app_ref, asset_reference, manager_reference)
Vesting-->>User: void

User->>Vesting: withdraw_from_delegator(delegator, vestee, main_app_ref, asset_reference, manager_reference)
Vesting-->>User: void

Manager->>Vesting: add_whitelisted_app(algo_xfer, app_id)
Vesting-->>Manager: void

Manager->>Vesting: remove_whitelisted_app(app_id)
Vesting-->>Manager: void

```

### Gora Stake delegation Contracts: V2


The StakeDelegator contract serves as a central hub for staking operations in the GoraNetwork. It facilitates the initialization of a stake delegation manager app on-chain with parameters like the Gora main app's ID, address, and stake delegation manager's address. Users can opt into the system, stake their assets, and unstake them when needed. The contract also provides functionalities for users to claim their stakes, manually process aggregations, and register participation keys. Managers have the flexibility to configure settings, such as updating their address and defining their share percentages. Additionally, the contract ensures secure transfers of Algos and assets, making it a pivotal component in the staking ecosystem of GoraNetwork.

```mermaid

graph TB

    subgraph StakeDelegator
        init_app[init_app]
        opt_in[opt_in]
        stake[stake]
        unstake[unstake]
        user_claim[user_claim]
        manual_process_aggregation[manual_process_aggregation]
        register_participation_key[register_participation_key]
        configure_settings[configure_settings]
        withdraw_non_stake[withdraw_non_stake]
    end



    Owner((Owner)) ---> init_app
    User((User)) ---> opt_in
    User((User)) ---> stake
    User((User)) ---> unstake
    User((User)) ---> user_claim
    User((User)) ---> manual_process_aggregation
    Manager((Manager)) ---> register_participation_key
    Manager((Manager)) ---> configure_settings
    User((User)) ---> withdraw_non_stake


```
```mermaid
sequenceDiagram
    participant User as User
    participant StakeDelegator as StakeDelegator

    Owner->>StakeDelegator: init_app(asset, timelock, main_app_id, main_app_addr, manager_address, manager_algo_share, manager_gora_share, algo_xfer)
    StakeDelegator-->>Owner: void

    User->>StakeDelegator: opt_in(vesting_app_id)
    StakeDelegator-->>User: void

    User->>StakeDelegator: stake(asset_pay, vesting_on_behalf_of, main_app_ref, asset_reference, manager_reference)
    StakeDelegator-->>User: void

    User->>StakeDelegator: unstake(amount_to_withdraw, main_app_ref, asset_reference, manager_reference)
    StakeDelegator-->>User: void

    User->>StakeDelegator: user_claim(asset_reference, main_app_reference, manager_reference)
    StakeDelegator-->>User: void

    User->>StakeDelegator: manual_process_aggregation(asset_reference, main_app_reference, manager_reference)
    StakeDelegator-->>User: void

    Manager->>StakeDelegator: register_participation_key(new_key, main_ref)
    StakeDelegator-->>Manager: void

    Manager->>StakeDelegator: configure_settings(manager_address, manager_algo_share, manager_gora_share)
    StakeDelegator-->>Manager: void

    User->>StakeDelegator: withdraw_non_stake(vesting_on_behalf_of, goracle_token_reference, main_app_reference, manager_reference)
    StakeDelegator-->>User: void


```
## Gora DAO Contracts: V1

GoraDAO contracts follow these principal designs:
- No static or hard coded value
- All scenarios are created based on C2C calls to GoraDAO main contract
- There are one Proposal and one Vesting contract per Proposal to make the GoraDAO as decentralized and permission-less as possible!
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

GoraDAO main contract, once deployed to a network, will be responsible for generating Proposal units, consisted of a Proposal and a Vesting Contract dedicated to that proposal case! This design is to take permission-less and decentralization to the max for GoraDAO!
GoraNetwork deploys the GoraDAO main contract and owns managerial rights to it and optionally can assign a manager address to delegate the authority to another Algorand account address!

Proposal contract create and configure ABI calls would create Proposal units (if all criteria is met by the call ARGs) and after that the Proposal creator account would be the manager of that Proposal unit and inherently can assign and delegate this to another account!
The scope of authority Proposal manager account has is not broad and is only to maintain 100% non-custodial, decentralized and permission-less DAO protocol, nothing more! For example, Proposal manager cannot delete proposal and just can deactivate it and withdraw from it! Delete and update are disabled on Proposals as well as their peer vesting contracts!

Some methods are support methods and actual operation happens on the method with same name but different signature on Proposal smart contract! this interaction mostly assures some criteria checks for Proposal interaction and some state updates for GoraDAO! Those methods are:

- Configure_Proposal
- Activate_Voting
- Proposal_Participate
- Proposal_Withdraw_Participation
- Force_Close_Proposal

Force_Close_Proposal is a multi step process , only designed for extreme emergency cases where something is agreed by almost everyone to go wrong and therefore grants from owner, manager_address and also Gora main contract manager are needed to be effective and close the Proposal and archive it! There are no limitations on creating a new Proposal with identical specifications though!

The activate_proposal is a manual override in case of min_participation is not met! The voting activation handled in GoraDAO:
- Time based activation in case that min-participation is met!
- Min participation is met before start time---> activate_proposal can activate (This does not change the voting ending conditions including end_time and all_voted).

Note : Because the vesting and staking contracts architecture is still an open topic in GoraNetwork, Configure_Vesting method is not detailed in ABI or TEAL code yet!

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
GoraDAO Proposal contracts are created from an ABI call to main contract and constitute an inner transaction C2C call for the aspect of Proposal contract that GoraDAO main contract manages (Some steps of Proposal lifecycle goes by direct ABI calls from clients)!

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
### Gora DAO Vesting Contract: V1

GoraDAO Vesting contracts are bound to Proposals and will be activated by the first successful vote approval which passes the active proposal threshold! 

The vesting algorithm is provided by Configure_Vesting method, during which the vesting configuration is sent via args plus necessary related data such as proper Lease values as needed! There are two major vesting algorithm parameters:

- Initial vesting delay (no matter what this much round or time further vesting starts)
- Based on vesting config including how many payments and time window between vestings!
- After voting starts on Proposal contract there is no configurations allowed

TODO: Vesting algorithm ...

QUESTION: Is this a good approach to have vesting contract per approved proposal which intends to maximize decentralization or it is better to make it less decentralized and use Gora Vesting contract and stake delegation ABIs via C2C calls from Proposal contracts? Regardless , the focus is on GoraDAO Proposals contracts lifecycle and Voting operations!

IDEA: A time beacon oracle for apps to subscribe to and receive push chain time scheduled or GoraDAO events based announcements (this can be extended into VRF random beacon and app ABI call beacon oracles as to be added to GoraNetworks oracle catalogues)!

IDEA: the above idea can be generalized with an ARC for a general oracle beacon service from GoraNetwork! This does not need any consensus or voting and just using a predictable lease with all beacon sources!
  

```mermaid

graph TB
 
      subgraph GoraDAO Vesting
            GoraDAO_Vesting[GoraDAO_Vesting_ABI]
            Vesting_Create[vesting_create]
            Configure_Vesting[config_vesting]
            Vesting_Deposit_Algo[vesting_deposit_algo]
            Vesting_Deposit_Platform_Token[vesting_deposit_platform_token]
            Vesting_Transfer_Funds[vesting_transfer_funds]
        
        end
      
      GoraDAO_Vesting[GoraDAO_Vesting_ABI] ---> Vesting_Create
      GoraDAO_Vesting[GoraDAO_Vesting_ABI] ---> Configure_Vesting
      GoraDAO_Vesting[GoraDAO_Vesting_ABI] ---> Vesting_Deposit_Algo
      GoraDAO_Vesting[GoraDAO_Vesting_ABI] ---> Vesting_Deposit_Platform_Token
      GoraDAO_Vesting[GoraDAO_Vesting_ABI] ---> Vesting_Transfer_Funds


 

```