// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Shares {
    struct Stakeholder {
        address id;
        uint256 share;
        uint256 claimedAmount;
    }

    mapping(address => Stakeholder) public stakeholders;

    uint256 public totalShares;

    uint256 public dividendsPool;

    uint256 public dividendsTotal;

    event DividendsRegistered(uint256 amount);
    event DividendsReleased(address recipient, uint256 amount);

    constructor() {
        totalShares = 0;
        dividendsPool = 0;
    }

    function getShare(address _holder) public view returns(uint256) {
        return stakeholders[_holder].share;
    }

    function getTotalShares() public view returns(uint256) {
        return totalShares;
    }

    function getDividendsPool() public view returns(uint256) {
        return dividendsPool;
    }

    function addStakeholder(address _address, uint256 _share) public {
        require(_share != 0, "Share cannot be zero");

        if(stakeholders[_address].id == _address) {
            stakeholders[_address].share += _share;
        } else {
            Stakeholder memory stakeholder = Stakeholder({
                id: _address,
                share: _share,
                claimedAmount: 0
            });

            stakeholders[_address] = stakeholder;
        }

        totalShares += _share;
    }

    function addDividends() payable external {
        dividendsPool += msg.value;
        dividendsTotal += msg.value;
        emit DividendsRegistered(msg.value);
    }

    function claimDividends(address payable recipient) public {
        require(dividendsPool > 0, "Dividends pool is empty");

        Stakeholder memory stakeholder = stakeholders[recipient];

        require(stakeholder.id == recipient, "There is no such stakeholder");

        uint256 amountToPay = stakeholder.share * dividendsTotal / totalShares - stakeholder.claimedAmount;

        require(amountToPay > 0, "No dividends to pay");
        require(amountToPay <= dividendsPool, "Not enought money in the pool");

        stakeholders[recipient].claimedAmount += amountToPay;
        dividendsPool -= amountToPay;
        (bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

        require(sent, "Failed to send dividends");

        emit DividendsReleased(recipient, amountToPay);
    }
}