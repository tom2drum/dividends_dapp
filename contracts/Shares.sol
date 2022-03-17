// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Shares is Ownable {
    struct Stakeholder {
        address id;
        uint256 shares;
        uint256 claimedAmount;
    }

    mapping(address => Stakeholder) public stakeholders;

    uint private _stakeholdersNum;

    uint256 private _dividendsTotal;

    uint public soldShares;

    uint public totalShares;

    event StakeholderRegistered(address _address, uint256 _share);
    event StakeholdersShareChanged(address _address, uint256 _share);
    event DividendsReceived(uint256 amount);
    event DividendsReleased(address recipient, uint256 amount);

    constructor(uint _totalShares) {
        require(_totalShares > 1, "Total number of shares should be greater than 1");
        totalShares = _totalShares;
    }

    receive() external payable virtual onlyOwner {
        require(_stakeholdersNum > 1, "There is not enough stakeholders yet");

        _dividendsTotal += msg.value;
        emit DividendsReceived(msg.value);
    }
    
    function getStakeholderShares() public view returns(uint256) {
        require(stakeholders[_msgSender()].id == _msgSender(), "There is no such stakeholder");

        return stakeholders[_msgSender()].shares;
    }

    function getSoldShares() public view returns(uint) {
        return soldShares;
    }

    function getTotalShares() public view returns(uint) {
        return totalShares;
    }

    function getDividendsPool() public view returns(uint256) {
        return address(this).balance;
    }

    function registerStakeholder(address _address, uint256 _shares) public onlyOwner {
        require(_shares != 0, "Shares cannot be zero");

        uint256 dividendsPool = getDividendsPool();

        require(dividendsPool == 0, "Contract has undistributed dividends");

        uint availableShares = totalShares - getSoldShares();

        require(availableShares >= _shares, "Unsufficient share amount");

        if(stakeholders[_address].id == _address) {
            stakeholders[_address].shares += _shares;

            emit StakeholdersShareChanged(_address, stakeholders[_address].shares);
        } else {
            Stakeholder memory stakeholder = Stakeholder({
                id: _address,
                shares: _shares,
                claimedAmount: 0
            });

            stakeholders[_address] = stakeholder;

            _stakeholdersNum++;

            emit StakeholderRegistered(_address, _shares);
        }

        soldShares += _shares;
    }

    function claimDividends() public {
        uint256 dividendsPool = getDividendsPool();
        require(dividendsPool > 0, "Dividends pool is empty");

        Stakeholder memory stakeholder = stakeholders[_msgSender()];

        require(stakeholder.id == _msgSender(), "There is no such stakeholder");

        uint256 amountToPay = _getAmountToPay(stakeholder);

        require(amountToPay > 0, "No dividends to pay");
        require(amountToPay <= dividendsPool, "Not enought money in the pool");

        stakeholders[_msgSender()].claimedAmount += amountToPay;
        (bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

        require(sent, "Failed to send dividends");

        emit DividendsReleased(_msgSender(), amountToPay);
    }

    function _getAmountToPay(Stakeholder memory stakeholder) private view returns(uint256) {
        return stakeholder.shares * _dividendsTotal / totalShares - stakeholder.claimedAmount;
    }
}