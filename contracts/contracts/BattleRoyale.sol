// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BattleRoyale is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct PoolEntry {
        string poolEntryName;
        uint256[10] picks;
        bool isRegistered;
    }

    IERC20 usdc = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);

    uint256[] public eliminatedTeams;

    bool public isRegistrationOpen = false;
    uint256 public day = 0;
    uint256 public version = 0;

    mapping(uint256 => mapping(address => PoolEntry)) public poolEntries;

    event Registered(address poolEntryAddress, string poolEntryName);
    event BattleRoyalePoolReset();
    event DaySet(uint256 day);
    event RegistrationOpened();
    event RegistrationClosed();
    event PickMade(address poolEntryAddress, uint256 pick, uint256 day);
    event TeamsEliminated(uint256[] eliminatedTeams);
    event WinnerPaidout(address poolEntryAddress, uint256 amount);
    event ContractDeployed(address deployerAddress);
    event AdminRoleGranted(address adminAddress);
    event VersionIncremented(uint256 version);

    constructor(address[] memory admins) {
        for (uint256 i = 0; i < admins.length; i++) {
            _grantRole(ADMIN_ROLE, admins[i]);
            emit AdminRoleGranted(admins[i]);
        }
        emit ContractDeployed(msg.sender);
    }

    function registerPoolEntry(string memory _poolEntryName) public {
        require(isRegistrationOpen, "Registration is closed");
        require(getAllowance() >= 10000000, "Not enough funds approved for transfer");
        PoolEntry memory newPoolEntry;
        newPoolEntry.poolEntryName = _poolEntryName;
        newPoolEntry.isRegistered = true;
        poolEntries[version][msg.sender] = newPoolEntry;
        usdc.transferFrom(msg.sender, address(this), 10000000);
        emit Registered(msg.sender, _poolEntryName);
    }

    function getAllowance() public view returns (uint256) {
        return usdc.allowance(msg.sender, address(this));
    }

    function resetBattleRoyalePool() public onlyRole(ADMIN_ROLE) {
        require(!isRegistrationOpen, "Registration must be closed in order to reset");
        incrementVersion();
        delete eliminatedTeams;
        day = 0;
        emit BattleRoyalePoolReset();
    }

    function setDay(uint256 _day) public onlyRole(ADMIN_ROLE) {
        require(!isRegistrationOpen, "Registration must be closed in order to set day");
        day = _day;
        emit DaySet(_day);
    }

    function openRegistration() public onlyRole(ADMIN_ROLE) {
        require(!isRegistrationOpen, "Registration is already open");
        isRegistrationOpen = true;
        emit RegistrationOpened();
    }

    function closeRegistration() public onlyRole(ADMIN_ROLE) {
        require(isRegistrationOpen, "Registration is already closed");
        isRegistrationOpen = false;
        emit RegistrationClosed();
    }

    function makeAPick(uint256 _pick, uint256 _day) public {
        require(!isRegistrationOpen, "Registration must be closed in order to make or edit a pick");
        require(poolEntries[version][msg.sender].isRegistered, "Pool entry does not exist");
        require(!isEntryEliminated(msg.sender), "Pool entry is eliminated");
        require(_pick != 0 && _pick <= 64, "Pick is not valid");
        require(_day >= day, "Invalid day");

        uint256[10] memory poolEntryPicks = getPoolEntryPicks(msg.sender);
        for (uint256 i = 0; i < poolEntryPicks.length; i++) {
            require(_pick != poolEntryPicks[i], "Pick already exists");
        }
        poolEntries[version][msg.sender].picks[_day] = _pick;
        emit PickMade(msg.sender, _pick, _day);
    }

    function updateEliminatedTeams(uint256[] memory _eliminatedTeams) public onlyRole(ADMIN_ROLE) {
        require(eliminatedTeams.length + _eliminatedTeams.length < 64, "Too many teams eliminated");
        for (uint256 i = 0; i < _eliminatedTeams.length; i++) {
            require(_eliminatedTeams[i] != 0 && _eliminatedTeams[i] <= 64, "Invalid team");
            eliminatedTeams.push(_eliminatedTeams[i]);
        }
        emit TeamsEliminated(_eliminatedTeams);
    }

    function payoutWinner(address payable _address, uint256 _amount) public onlyRole(ADMIN_ROLE) {
        require(poolEntries[version][_address].isRegistered, "Pool entry does not exist");
        require(!isEntryEliminated(_address), "Pool entry is eliminated");
        require(usdc.balanceOf(address(this)) >= _amount, "Contract does not have enough funds");
        usdc.transfer(_address, _amount);
        emit WinnerPaidout(_address, _amount);
    }

    function getPoolEntryPicks(address _address) public view returns (uint256[10] memory) {
        return poolEntries[version][_address].picks;
    }


    function getEliminatedTeams() public view returns (uint256[] memory) {
        return eliminatedTeams;
    }

    function incrementVersion() public onlyRole(ADMIN_ROLE) {
        version++;
        emit VersionIncremented(version);
    }

    function isEntryEliminated(address _address) public view returns (bool) {
        uint256[10] memory poolEntryPicks = getPoolEntryPicks(_address);
        for (uint256 i = 0; i < poolEntryPicks.length; i++) {
            for (uint256 j = 0; j < eliminatedTeams.length; j++) {
                if (poolEntryPicks[i] == eliminatedTeams[j] && i <= day) {
                    return true;
                }
            }
        }
        return false;
    }

    receive() external payable {}
}
