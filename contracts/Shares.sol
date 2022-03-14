// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Shares {
    struct Stakeholder {
        address id;
        uint256 share;
        bool hasClaimed;
    }

    mapping(address => Stakeholder) public stakeholders;

    uint256 public totalShares;

    uint256 public dividendsPool;

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
        if(stakeholders[_address].id == _address) {
            stakeholders[_address].share += _share;
        } else {
            Stakeholder memory stakeholder = Stakeholder({
                id: _address,
                share: _share,
                hasClaimed: false
            });

            stakeholders[_address] = stakeholder;
        }

        totalShares += _share;
    }

    function addDividends() payable external {
        dividendsPool += msg.value;
        emit DividendsRegistered(msg.value);
    }

    function claimDividends(address payable recipient) public {
        Stakeholder memory stakeholder = stakeholders[recipient];

        uint256 amountToPay = stakeholder.share * dividendsPool / totalShares;
        stakeholder.hasClaimed = true;

        (bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

        require(sent, "Failed to send dividends");

        emit DividendsReleased(recipient, amountToPay);
    }
}