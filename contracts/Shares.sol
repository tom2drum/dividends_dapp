// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

contract Shares is Ownable {

	uint public constant STAKEHOLDERS_LIMIT = 20;

	struct Stakeholder {
		address id;
		uint16 shares;
		uint csaClaimed; // claimed amount in current shares allocation
		uint unclaimedTotal; // total unclaimed amount
	}

	mapping(address => Stakeholder) private stakeholders;

	uint private csaTotal; //total received amount in current shares allocation
	uint private payedTotal;
	uint private unclaimedTotal;
	uint private undistributedTotal;

	uint16 private soldShares;
	uint16 private totalShares;

	uint8 private stakeholdersLimit;
	address[] private registeredStakeholders;

	event StakeholderRegistered(address _address, uint256 _share);
	event StakeholdersShareChanged(address _address, uint256 _share);
	event DividendsReceived(uint256 amount);
	event DividendsReleased(address recipient, uint256 amount);

	constructor(uint16 _totalShares, uint8 _stakeholdersLimit) {
		require(_totalShares > 1, "Total number of shares should be greater than 1");
		require(_stakeholdersLimit <= STAKEHOLDERS_LIMIT, "Maximum allowed stakeholders exceeded");

		totalShares = _totalShares;
		stakeholdersLimit = _stakeholdersLimit;
	}

	receive() external payable virtual onlyOwner {
		require(registeredStakeholders.length > 1, "There is not enough stakeholders yet");

		csaTotal += msg.value;

		emit DividendsReceived(msg.value);
	}

	function getStakeholderShares() public view returns (uint256) {
		require(stakeholders[_msgSender()].id == _msgSender(), "There is no such stakeholder");

		return stakeholders[_msgSender()].shares;
	}

	function getSoldShares() public view returns (uint256) {
		return soldShares;
	}

	function getTotalShares() public view returns (uint256) {
		return totalShares;
	}

	function getTotalBalance() public view returns (uint256) {
		return address(this).balance;
	}

	function getCurrentPool() public view returns (uint256) {
		return getTotalBalance() - unclaimedTotal - undistributedTotal;
	}

	function getUndistributedDividends() public view returns (uint256) {
		return undistributedTotal;
	}

	function registerShares(address _address, uint16 _shares) public onlyOwner {
		require(owner() != _address, "Cannot register shares for the contract owner");

		uint256 availableShares = totalShares - getSoldShares();
		require(availableShares >= _shares, "Unsufficient share amount");
		require(stakeholders[_address].id == _address || _shares > 0, "Shares cannot be zero");

		uint256 pool = getCurrentPool();
		if (pool > 0) {
			distributeUnclaimedDividends();
			csaTotal = 0;
		}

		if (stakeholders[_address].id == _address) {
			changeStakeholderShares(_address, _shares);
		} else {
			addStakeholder(_address, _shares);
		}
	}

	function claimDividends() public {
		Stakeholder memory stakeholder = stakeholders[_msgSender()];
		require(stakeholder.id == _msgSender(), "There is no such stakeholder");

		uint256 amountToPay = getAmountToPay(stakeholder);

		require(amountToPay > 0, "No dividends to pay");
		require(amountToPay <= getTotalBalance(), "Not enought money in the pool");

		payedTotal += amountToPay;
		unclaimedTotal -= stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].csaClaimed += amountToPay - stakeholder.unclaimedTotal;
		stakeholders[_msgSender()].unclaimedTotal = 0;
		(bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

		require(sent, "Failed to send dividends");

		emit DividendsReleased(_msgSender(), amountToPay);
	}

	function addStakeholder(address _address, uint16 _shares) private {
		Stakeholder memory stakeholder = Stakeholder({ id: _address, shares: _shares, csaClaimed: 0, unclaimedTotal: 0 });

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

	function distributeUnclaimedDividends() private {
		for (uint index = 0; index < registeredStakeholders.length; index++) {
			uint unclaimedAmount = getCsaUnclaimedAmount(stakeholders[registeredStakeholders[index]]);
			stakeholders[registeredStakeholders[index]].unclaimedTotal += unclaimedAmount;
			stakeholders[registeredStakeholders[index]].csaClaimed = 0;
			unclaimedTotal += unclaimedAmount;
		}

		undistributedTotal += csaTotal * (totalShares - soldShares) / totalShares;
	}

	function getAmountToPay(Stakeholder memory stakeholder) private view returns (uint256) {
		return getCsaUnclaimedAmount(stakeholder) + stakeholder.unclaimedTotal;
	}

	function getCsaUnclaimedAmount(Stakeholder memory stakeholder) private view returns (uint256) {
		if (csaTotal == 0) {
			return 0;
		}
		return (stakeholder.shares * csaTotal) / totalShares - stakeholder.csaClaimed;
	}
}
