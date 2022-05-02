// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

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
*	incomplete shares allocation. The owner can withdraw this amount of money at any time.
 */
contract Dividends is Ownable {

	/// @dev Stakeholder structure that holds info about registered stakeholder.
	struct Stakeholder {
		uint16 shares; /// @dev Current amount of shares.
		uint unclaimed; /// @dev Total unclaimed amount.
		uint lastTimeIssued; /// @dev Dividends total when stakeholder interacted with the contract last time
	}

	mapping(address => Stakeholder) private stakeholders;

	uint private issued;
	uint private payed;
	uint private undistributed;

	uint16 private soldShares;
	uint16 private immutable totalShares;

	event StakeholdersShareSet(address indexed _address, uint _share);
	event DividendsIssued(uint amount);
	event DividendsReleased(address indexed recipient, uint amount);
	event DividendsWithdrawn(uint amount);

	error UnauthorizedRequest();
	error InsufficientFunds(uint available, uint requested);
	error InsufficientShareAmount(uint16 available, uint16 requested);
	error NeedsMoreThanZero();

	modifier moreThanZero(uint amount) {
        if (amount == 0) {
            revert NeedsMoreThanZero();
        }
        _;
    }

	modifier onlySharesOwner() {
        if(stakeholders[_msgSender()].shares == 0 && stakeholders[_msgSender()].unclaimed == 0) {
			revert UnauthorizedRequest();
		}
        _;
    }

	/**
	* @dev Initializes the contract with appropriate amount of company's shares.
	* @param _totalShares Total amount of shares that can be sold.
	*/
	constructor(uint16 _totalShares) moreThanZero(_totalShares) {
		totalShares = _totalShares;
	}

	/**
    * @dev The contract is able to receive ETH as dividends payment.
	* The received amount will be logged with { DividendsIssued } event.
    */
	receive() external payable virtual onlyOwner {
		undistributed += msg.value * (getTotalShares() - getSoldShares()) / getTotalShares();
		issued += msg.value;

		emit DividendsIssued(msg.value);
	}

	/**
    * @dev Getter for current amount of stakeholder's shares. Note that it will throw an error for
	* unauthorized request.
	* @return uint Stakeholder's share amount
    */
	function getStakeholderShares() external view onlySharesOwner returns (uint) {
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
	function getAmountToClaim() public view onlySharesOwner returns (uint) {
		return stakeholders[_msgSender()].unclaimed + calculateUnclaimed(_msgSender());
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
		return undistributed;
	}

	/**
    * @dev Getter for overall amount of ETH payed to stakeholders
	* @return uint Total payed amount
    */
	function getPayed() external view returns (uint) {
		return payed;
	}

	/**
    * @dev Register shares for provided address. Note that it can be run only by the contract
	* owner and on behalf of any other network address. If the provided address has been already registered, 
	* then its corresponding shares will be overridden with the given amount and the { StakeholdersShareSet } event
	* will be logged. If it is not the case, then the new stakeholder will be created and { StakeholdersShareSet } event
	* will be emitted. Note that the owner can delete a stakeholder using this method by providing zero as desirable amount
	* of shares.
	* @param _address Stakeholder address
	* @param _shares New shares amount
    */
	function setShares(address _address, uint16 _shares) external onlyOwner {
		require(owner() != _address, "Owner cannot be a stakeholder");

		uint16 availableShares = getTotalShares() - getSoldShares() + stakeholders[_address].shares;
		if (availableShares < _shares) {
			revert InsufficientShareAmount(availableShares, _shares);
		}

		if (stakeholders[_address].shares == 0 && _shares == 0) {
			revert NeedsMoreThanZero();
		}

		soldShares = soldShares - stakeholders[_address].shares + _shares;

		stakeholders[_address].unclaimed = stakeholders[_address].shares == 0 ? 0 : calculateUnclaimed(_address);
		stakeholders[_address].lastTimeIssued = issued;
		stakeholders[_address].shares = _shares;

		emit StakeholdersShareSet(_address, stakeholders[_address].shares);
	}

	/**
	* @dev Triggers the transfer to the message sender account of all ETH that the sender haven't claimed yet
	* during previous dividends issues. { DividendsReleased } event is logged as a result of the method call
	*/
	function claim() external onlySharesOwner {
		uint amountToPay = getAmountToClaim();
		require(amountToPay > 0, "No dividends to pay");

		uint balance = getTotalBalance();
		if(amountToPay > balance) {
			revert InsufficientFunds(balance, amountToPay);
		}

		payed += amountToPay;
		stakeholders[_msgSender()].unclaimed = 0;
		stakeholders[_msgSender()].lastTimeIssued = issued;
		(bool success, ) = _msgSender().call{ value: amountToPay }("");

		require(success, "Failed to send dividends");

		emit DividendsReleased(_msgSender(), amountToPay);
	}

	/**
	* @dev Triggers the transfer of all not distributed dividends to the owner's account and emits { DividendsWithdrawn } event
	*/
	function withdrawUndistributed() external onlyOwner {
		require(undistributed > 0, "Nothing to withdraw");
		assert(getTotalBalance()  >= undistributed);
		
		(bool sent, ) = _msgSender().call{ value: undistributed }("");

		require(sent, "Failed to withdraw dividends");

		emit DividendsWithdrawn(undistributed);
		undistributed = 0;
	}

	function calculateUnclaimed(address _address) internal view returns (uint) {
		if(stakeholders[_address].lastTimeIssued == issued) {
			return 0;
		}

		return stakeholders[_address].shares * (issued - stakeholders[_address].lastTimeIssued) / totalShares;
	}
}
