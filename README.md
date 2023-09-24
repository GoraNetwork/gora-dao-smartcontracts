# gora-dao-smartcontracts

#### GoraDAO is Gora Network's DAO system!

This repository contains Algorand AVM smart contracts of GoraDAO!

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
```mermaid

graph TB
 
      subgraph Gora DAO Main ABI
            GoraDAO_Main[GoraDAO_Main]
            GoraDAO_Create[create_dao]
            GoraDAO_Init[init_dao]
     
      
        end
      


      GoraDAO_Main[GoraDAO_Main] --> GoraDAO_Create
      GoraDAO_Main[GoraDAO_Main] --> GoraDAO_Init


  


```
### Gora DAO Proposal Contract: V1
### Gora DAO Vesting Contract: V1
