// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

/// @title Dividends distribution contract
/// @author Tom Goriunov
/** @notice
*	This contract allows to distribute a company's earnings among registered stakeholders. 
*
* 	The owner which is also being the source of the income deploys the contract with appropriate amount of shares
* 	to sell. Once done, he can register stakeholders and transfer money directly to the contract address that will 
*	be used as dividends. 
*
*	The dividends can be claimed by stakeholders upon request basis (pull payment model). This means that all payments 
*	will be not automatically forwarded to all eligible parties when new dividends are issued. Instead the actual transfer
*	of the money should be manually triggered by every stakeholder account by calling the `claim` method.
*
*	During the lifetime of the contract the owner is able to change the shares allocation between stakeholders or 
*	add a new one even when some dividends were deposited and partly claimed. 
*
*	The contract also accumulate the part of the dividends that was not distributed among parties due to
*	incomplete shares allocation. The owner can withdraw this amount of money at any given point.
 */
contract Dividends is Ownable {

	/// @notice Maximum amount of stakeholders in the contract.
	uint public constant STAKEHOLDERS_LIMIT = 20;

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

	event StakeholderRegistered(address indexed _address, uint256 _share);
	event StakeholdersShareChanged(address indexed _address, uint256 _share);
	event DividendsIssued(uint256 amount);
	event DividendsReleased(address indexed recipient, uint256 amount);

	/**
	* @dev Initializes the contract with appropriate amount of company's shares and maximum amount of share holders.
	* @param _totalShares Total amount of shares that can be sold.
	* @param _stakeholdersLimit Total amount of stakeholders that can be registered.
	*/
	constructor(uint16 _totalShares, uint8 _stakeholdersLimit) {
		require(_totalShares > 1, "Total number of shares should be greater than 1");
		require(_stakeholdersLimit <= STAKEHOLDERS_LIMIT, "Maximum allowed stakeholders exceeded");

		totalShares = _totalShares;
		stakeholdersLimit = _stakeholdersLimit;
	}

	/**
    * @dev The contract should be able to receive Eth, but only if there is enough eligible stakeholders.
	* The received amount will be logged with { DividendsIssued } event.
    */
	receive() external payable virtual onlyOwner {
		require(registeredStakeholders.length > 1, "There is not enough stakeholders yet");

		csaTotal += msg.value;
		undistributedTotal += msg.value * (getTotalShares() - getSoldShares()) / getTotalShares();

		emit DividendsIssued(msg.value);
	}

	/**
    * @dev Getter for current amount of stakeholder's shares. Note that it will throw an error for
	* unauthorized request.
    */
	function getStakeholderShares() external view returns (uint256) {
		require(stakeholders[_msgSender()].shares != 0, "There is no such stakeholder");
		return stakeholders[_msgSender()].shares;
	}

	/**
    * @dev Getter for total amount of sold shares.
    */
	function getSoldShares() public view returns (uint256) {
		return soldShares;
	}

	/**
    * @dev Getter for total amount of shares.
    */
	function getTotalShares() public view returns (uint256) {
		return totalShares;
	}

	/**
    * @dev Retrieves the balance of the contract. Note that the balance is always
	* consists of the amount of unclaimed and undistributed dividends.
    */
	function getTotalBalance() public view returns (uint256) {
		return address(this).balance;
	}

	/**
    * @dev Getter for total amount of dividends in the pool corresponding to the current shares allocation.
    */
	function getCurrentPool() public view returns (uint256) {
		return getTotalBalance() - unclaimedTotal - undistributedTotal;
	}

	/**
    * @dev Getter for total amount of undistributed dividends.
    */
	function getUndistributed() external view returns (uint256) {
		return undistributedTotal;
	}

	function registerShares(address _address, uint16 _shares) external onlyOwner {
		require(owner() != _address, "Cannot register shares for the contract owner");

		uint256 availableShares = getTotalShares() - getSoldShares() + stakeholders[_address].shares;
		require(availableShares >= _shares, "Insufficient share amount");
		require(stakeholders[_address].shares > 0 || _shares > 0, "Shares cannot be zero");

		uint256 pool = getCurrentPool();
		if (pool > 0) {
			distributeUnclaimed();
			csaTotal = 0;
		}

		if (stakeholders[_address].shares > 0) {
			changeStakeholderShares(_address, _shares);
		} else {
			require(registeredStakeholders.length < stakeholdersLimit, "Cannot add more stakeholders than the limit");
			addStakeholder(_address, _shares);
		}
	}

	function claim() external {
		Stakeholder memory stakeholder = stakeholders[_msgSender()];
		require(stakeholder.shares > 0, "There is no such stakeholder");

		uint256 amountToPay = getAmountToPay(stakeholder);

		require(amountToPay > 0, "No dividends to pay");
		require(amountToPay <= getTotalBalance(), "Not enought money in the pool");

		payedTotal += amountToPay;
		unclaimedTotal -= stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].csaClaimed += amountToPay - stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].unclaimedTotal = 0;
		(bool sent, ) = _msgSender().call{ value: amountToPay }("");

		require(sent, "Failed to send dividends");

		emit DividendsReleased(_msgSender(), amountToPay);
	}

	function addStakeholder(address _address, uint16 _shares) private {
		Stakeholder memory stakeholder = Stakeholder({ shares: _shares, csaClaimed: 0, unclaimedTotal: 0 });

		stakeholders[_address] = stakeholder;

		soldShares += _shares;

		registeredStakeholders.push(_address);

		emit StakeholderRegistered(_address, _shares);
	}

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

	function distributeUnclaimed() private {
		for (uint index = 0; index < registeredStakeholders.length; index++) {
			uint unclaimedAmount = getCsaUnclaimedAmount(stakeholders[registeredStakeholders[index]]);
			stakeholders[registeredStakeholders[index]].unclaimedTotal += unclaimedAmount;
			stakeholders[registeredStakeholders[index]].csaClaimed = 0;
			unclaimedTotal += unclaimedAmount;
		}
	}

	function getAmountToPay(Stakeholder memory stakeholder) private view returns (uint256) {
		return getCsaUnclaimedAmount(stakeholder) + stakeholder.unclaimedTotal;
	}

	function getCsaUnclaimedAmount(Stakeholder memory stakeholder) private view returns (uint256) {
		if (csaTotal == 0) {
			return 0;
		}
		return (stakeholder.shares * csaTotal) / getTotalShares() - stakeholder.csaClaimed;
	}
}
