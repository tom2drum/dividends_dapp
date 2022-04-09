// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

/** @title Dividends distribution contract
*	@author Tom Goriunov
*	@notice
*	This contract allows to distribute a company's earnings among registered stakeholders. 
*
* 	The owner which is also being the source of the income deploys the contract with appropriate amount of shares
* 	to sell. Once done, he can register stakeholders and transfer money directly to the contract address for later
*	usage as dividends. 
*
*	The dividends can be claimed by stakeholders upon request basis (pull payment model). This means that all payments 
*	will be not automatically forwarded to all eligible parties when new dividends are issued. Instead the actual transfer
*	of the money should be manually triggered for every stakeholder account by calling the `claim` method.
*
*	During the lifetime of the contract the owner is able to change the shares allocation between stakeholders or 
*	add a new one even when some dividends were deposited and partly claimed. 
*
*	The contract also accumulate the part of the dividends that was not distributed among parties due to
*	incomplete shares allocation. The owner can withdraw this amount of money at any given point.
 */
contract Dividends is Ownable {

	/// @notice Maximum amount of stakeholders in the contract.
	uint8 public constant STAKEHOLDERS_LIMIT = 20;

	/// @dev Stakeholder structure that holds info about registered stakeholder.
	struct Stakeholder {
		uint16 shares; /// @dev Current amount of shares.
		uint csaClaimed; /// @dev Claimed amount in current shares allocation (csa).
		uint unclaimedTotal; /// @dev Total unclaimed amount.
	}

	mapping(address => Stakeholder) private stakeholders;

	uint private csaTotal; /// @dev Total amount of issued dividends in current shares allocation.
	uint private payedTotal;
	uint private unclaimedTotal;
	uint private undistributedTotal;

	uint16 private soldShares;
	uint16 private immutable totalShares;

	uint8 private immutable stakeholdersLimit;
	address[] private registeredStakeholders; /// @dev Array of registered stakeholders addresses.

	event StakeholderRegistered(address indexed _address, uint _share);
	event StakeholdersShareChanged(address indexed _address, uint _share);
	event DividendsIssued(uint amount);
	event DividendsReleased(address indexed recipient, uint amount);
	event DividendsWithdrawn(uint amount);

	error UnauthorizedRequest();
	error InsufficientFunds(uint available, uint requested);
	error InsufficientShareAmount(uint16 available, uint16 requested);
	error NotEnoughStakeholders(uint current, uint16 needed);
	error StakeholdersLimitReached(uint8 limit);

	/**
	* @dev Initializes the contract with appropriate amount of company's shares and maximum amount of share holders. The
	* amount of stakeholders are limited because of unclaimed dividends distribution process while shares allocation is changing
	* and 'run-out-of-gas' concerns.
	* @param _totalShares Total amount of shares that can be sold.
	* @param _stakeholdersLimit Total amount of stakeholders that can be registered.
	*/
	constructor(uint16 _totalShares, uint8 _stakeholdersLimit) {
		require(_totalShares > 1, "Shares amount is too low");
		require(_stakeholdersLimit <= STAKEHOLDERS_LIMIT, "Stakeholders limit violated");

		totalShares = _totalShares;
		stakeholdersLimit = _stakeholdersLimit;
	}

	/**
    * @dev The contract is able to receive ETH, but only if there is enough eligible stakeholders.
	* The received amount will be logged with { DividendsIssued } event.
    */
	receive() external payable virtual onlyOwner {
		if(registeredStakeholders.length < 2) {
			revert NotEnoughStakeholders(registeredStakeholders.length, 2);
		}

		csaTotal += msg.value;
		undistributedTotal += msg.value * (getTotalShares() - getSoldShares()) / getTotalShares();

		emit DividendsIssued(msg.value);
	}

	/**
    * @dev Getter for current amount of stakeholder's shares. Note that it will throw an error for
	* unauthorized request.
	* @return uint Stakeholder's share amount
    */
	function getStakeholderShares() external view returns (uint) {
		if(stakeholders[_msgSender()].shares == 0) {
			revert UnauthorizedRequest();
		}
		return stakeholders[_msgSender()].shares;
	}

	/**
    * @dev Getter for current share amount for provided address. Note that it can be used only by
	* the contract owner
	* @return uint Stakeholder's share amount
    */
	function getStakeholderShares(address _address) external view onlyOwner returns (uint) {
		return stakeholders[_address].shares;
	}

	/**
    * @dev Getter for overall amount that the sender can claim from the contract
	* @return uint Total amount to claim
    */
	function getAmountToClaim() external view returns (uint) {
		Stakeholder memory stakeholder = stakeholders[_msgSender()];
		if(stakeholder.shares == 0) {
			revert UnauthorizedRequest();
		}

		return getAmountToPay(stakeholder);
	}

	/**
    * @dev Getter for total amount of sold shares.
	* @return unit16 Total realized shares
    */
	function getSoldShares() public view returns (uint16) {
		return soldShares;
	}

	/**
    * @dev Getter for total amount of shares.
	* @return unit16 Total issued shares
    */
	function getTotalShares() public view returns (uint16) {
		return totalShares;
	}

	/**
    * @dev Retrieves the balance of the contract. Note that the balance is always
	* consists of the amount of unclaimed and undistributed dividends.
	* @return unit Current balance
    */
	function getTotalBalance() public view returns (uint) {
		return address(this).balance;
	}

	/**
    * @dev Getter for total amount of undistributed dividends.
	* @return unit Undistributed dividends
    */
	function getUndistributed() external view returns (uint) {
		return undistributedTotal;
	}

	/**
    * @dev Getter for list of current stakeholder's addresses
	* @return address[] List of registered stakeholders
    */
	function getStakeholders() external view returns (address[] memory) {
		return registeredStakeholders;
	}

	/**
    * @dev Getter for overall amount of ETH payed to stakeholders
	* @return uint Total payed amount
    */
	function getPayedTotal() external view returns (uint) {
		return payedTotal;
	}

	/**
    * @dev Initiate process of new shares registration. Note that it can be run only by the contract
	* owner and on behalf of any other network address. If the provided address has been already registered, 
	* then its corresponding shares will be overridden with the given amount and the { StakeholdersShareChanged } event
	* will be logged. If it is not the case, then the new stakeholder will be created and { StakeholderRegistered } event
	* will be emitted. Note that the owner can delete a stakeholder using this method by providing zero as desirable amount
	* of shares.
	* @param _address Stakeholder address
	* @param _shares New shares amount
    */
	function registerShares(address _address, uint16 _shares) external onlyOwner {
		require(owner() != _address, "Owner cannot be a stakeholder");

		if(stakeholders[_address].shares == 0) {
			if(registeredStakeholders.length == stakeholdersLimit) {
				revert StakeholdersLimitReached(stakeholdersLimit);
			}

			if(_shares == 0) {
				revert("Shares cannot be zero");
			}
		}

		uint16 availableShares = getTotalShares() - getSoldShares() + stakeholders[_address].shares;
		if (availableShares < _shares) {
			revert InsufficientShareAmount(availableShares, _shares);
		}

		distributeUnclaimed();
		csaTotal = 0;

		if (stakeholders[_address].shares > 0) {
			changeStakeholderShares(_address, _shares);
		} else {
			addStakeholder(_address, _shares);
		}
	}

	/**
	* @dev Triggers the transfer to the message sender account of all ETH that the sender haven't claimed yet
	* during previous dividends issues. The amount is calculated according to the percentage of the sender's shares
	* in each share allocation step and his previous withdrawals. { DividendsReleased } event is logged as a result of
	* the method call
	*/
	function claim() external {
		Stakeholder memory stakeholder = stakeholders[_msgSender()];
		if(stakeholder.shares == 0) {
			revert UnauthorizedRequest();
		}

		uint amountToPay = getAmountToPay(stakeholder);
		uint balance = getTotalBalance();

		require(amountToPay > 0, "No dividends to pay");
		if(amountToPay > balance) {
			revert InsufficientFunds(balance, amountToPay);
		}

		payedTotal += amountToPay;
		unclaimedTotal -= stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].csaClaimed += amountToPay - stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].unclaimedTotal = 0;
		(bool sent, ) = _msgSender().call{ value: amountToPay }("");

		require(sent, "Failed to send dividends");

		emit DividendsReleased(_msgSender(), amountToPay);
	}

	/**
	* @dev Triggers the transfer of all not distributed dividends to the owner's account and emits { DividendsWithdrawn } event
	*/
	function withdrawUndistributed() external onlyOwner {
		require(undistributedTotal > 0, "Nothing to withdraw");
		assert(getTotalBalance()  >= undistributedTotal);
		
		(bool sent, ) = _msgSender().call{ value: undistributedTotal }("");

		require(sent, "Failed to withdraw dividends");

		emit DividendsWithdrawn(undistributedTotal);
		undistributedTotal = 0;
	}

	/**
	* @dev Adds a new stakeholder to the contract
	* @param _address Stakeholder address
	* @param _shares Shares amount
	*/
	function addStakeholder(address _address, uint16 _shares) private {
		Stakeholder memory stakeholder = Stakeholder({ shares: _shares, csaClaimed: 0, unclaimedTotal: 0 });

		stakeholders[_address] = stakeholder;

		soldShares += _shares;

		registeredStakeholders.push(_address);

		emit StakeholderRegistered(_address, _shares);
	}

	/**
	* @dev Modifies an existing stakeholder's share amount or delete it completely
	* @param _address Stakeholder address
	* @param _shares Shares amount
	*/
	function changeStakeholderShares(address _address, uint16 _shares) private {

		soldShares = soldShares - stakeholders[_address].shares + _shares;

		if (_shares == 0) {
			removeStakeHolderFromList(_address);
			delete stakeholders[_address];
		} else {
			stakeholders[_address].shares = _shares;
		}

		emit StakeholdersShareChanged(_address, stakeholders[_address].shares);
	}

	/**
	* @dev Removes an existing stakeholder from registration list
	* @param _address Stakeholder address
	*/
	function removeStakeHolderFromList(address _address) private {
		uint indexToRemove = registeredStakeholders.length;

		for (uint index = 0; index < registeredStakeholders.length; index++) {
			if (registeredStakeholders[index] == _address) {
				indexToRemove = index;
				break;
			}
		}

		if (indexToRemove < registeredStakeholders.length) {
			registeredStakeholders[indexToRemove] = registeredStakeholders[registeredStakeholders.length - 1];
			registeredStakeholders.pop();
		}
	}

	/**
	* @dev Distributes the amount of dividends that has not been claimed by stakeholders in current shares
	* allocation. Note that it is necessary to remember those amounts when allocation is changing, so the contract
	* can correctly calculate amounts for every stakeholders in upcoming withdrawals.
	*/
	function distributeUnclaimed() private {
		for (uint index = 0; index < registeredStakeholders.length; index++) {
			uint unclaimedAmount = getCsaUnclaimedAmount(stakeholders[registeredStakeholders[index]]);
			stakeholders[registeredStakeholders[index]].unclaimedTotal += unclaimedAmount;
			stakeholders[registeredStakeholders[index]].csaClaimed = 0;
			unclaimedTotal += unclaimedAmount;
		}
	}

	/**
	* @dev Calculates overall amount of dividends for the claim
	*/
	function getAmountToPay(Stakeholder memory stakeholder) private view returns (uint) {
		return getCsaUnclaimedAmount(stakeholder) + stakeholder.unclaimedTotal;
	}

	/**
	* @dev Calculates amount of dividends that stakeholder is able to claim from the current unclaimed pool
	* according to his shares and previously claimed amount in present shares allocation.
	*/
	function getCsaUnclaimedAmount(Stakeholder memory stakeholder) private view returns (uint) {
		if (csaTotal == 0) {
			return 0;
		}
		return (stakeholder.shares * csaTotal) / getTotalShares() - stakeholder.csaClaimed;
	}
}
