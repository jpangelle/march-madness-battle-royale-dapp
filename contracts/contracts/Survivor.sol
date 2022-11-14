// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Survivor is Ownable {
    struct PoolEntry {
        string poolEntryName;
        bool alive;
        uint256[] picks;
        bool isRegistered;
    }

    IERC20 token = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    address[] public poolEntryAddresses;
    bool public isRegistrationOpen = false;
    uint256 public day = 0;

    mapping(address => PoolEntry) public poolEntries;

    function registerPoolEntry(string memory _poolEntryName) public {
        require(isRegistrationOpen, "Registration is closed");
        require(getAllowance() >= 10000000, "Not enough funds approved for transfer");
        PoolEntry memory newPoolEntry;
        newPoolEntry.poolEntryName = _poolEntryName;
        newPoolEntry.alive = true;
        newPoolEntry.isRegistered = true;
        poolEntries[msg.sender] = newPoolEntry;
        poolEntryAddresses.push(msg.sender);
        token.transferFrom(msg.sender, address(this), 10000000);
    }

    function getAllowance() public view returns (uint256) {
        return token.allowance(msg.sender, address(this));
    }

    function resetSurvivorPool() public onlyOwner {
        require(!isRegistrationOpen, "Registration must be closed in order to reset");
        for (uint i = 0; i < poolEntryAddresses.length; i++) {
            delete poolEntries[poolEntryAddresses[i]];
        }
        delete poolEntryAddresses;
        day = 0;
    }

    function setDay(uint256 _day) public onlyOwner {
        require(!isRegistrationOpen, "Registration must be closed in order to set day");
        day = _day;
    }

    function openRegistration() public onlyOwner {
        require(!isRegistrationOpen, "Registration is already open");
        isRegistrationOpen = true;
    }

    function closeRegistration() public onlyOwner {
        require(isRegistrationOpen, "Registration is already closed");
        isRegistrationOpen = false;
    }

    function makeAPick(uint256 _pick) public {
        require(!isRegistrationOpen, "Registration must be closed in order to make a pick");
        require(poolEntries[msg.sender].isRegistered, "Pool entry does not exist");
        require(poolEntries[msg.sender].alive, "Pool entry is eliminated");
        require(poolEntries[msg.sender].picks.length < 10, "Too many picks, use editPick");
        require(_pick <= 63, "Pick is not valid");
        for (uint256 i = 0; i < poolEntries[msg.sender].picks.length; i++) {
            require(_pick != poolEntries[msg.sender].picks[i], "Pick already exists");
        }
        poolEntries[msg.sender].picks.push(_pick);
    }

    function editPick(uint256 _pick, uint256 _day) public  {
        require(!isRegistrationOpen, "Registration must be closed in order to edit a pick");
        require(poolEntries[msg.sender].isRegistered, "Pool entry does not exist");
        require(poolEntries[msg.sender].alive, "Pool entry is eliminated");
        require(_day >= day && _day <= 10, "Invalid day");
        poolEntries[msg.sender].picks[_day - 1] = _pick;
    }

    function eliminatePoolEntry(address _address) public onlyOwner {
        require(poolEntries[_address].isRegistered, "Pool entry does not exist");
        require(poolEntries[_address].alive, "Pool entry is already eliminated");
        poolEntries[_address].alive = false;
    }

    function payoutWinner(address payable _address, uint256 _amount) public onlyOwner {
        require(poolEntries[_address].isRegistered, "Pool entry does not exist");
        require(poolEntries[_address].alive, "Pool entry is eliminated");
        require(address(this).balance >= _amount, "Contract does not have enough funds");
        _address.transfer(_amount);
    }

    function getPoolEntryPicks(address _address) public view returns (uint256[] memory) {
        return poolEntries[_address].picks;
    }

    function getPoolEntries() public view returns (address[] memory) {
        return poolEntryAddresses;
    }

    receive() external payable {}
}
