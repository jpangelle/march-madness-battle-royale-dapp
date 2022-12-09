import { BigInt } from "@graphprotocol/graph-ts";
import {
  BattleRoyale,
  AdminRoleGranted,
  BattleRoyalePoolReset,
  ContractDeployed,
  DaySet,
  PickMade,
  Registered,
  RegistrationClosed,
  RegistrationOpened,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TeamsEliminated,
  VersionIncremented,
  WinnerPaidout,
} from "../generated/BattleRoyale/BattleRoyale";
import { Admin } from "../generated/schema";

export function handleAdminRoleGranted(event: AdminRoleGranted): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = Admin.load(event.transaction.from.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new Admin(event.transaction.from.toHex());

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0);
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1);

  // Entity fields can be set based on event parameters
  entity.adminAddress = event.params.adminAddress;

  // Entities can be written to the store with `.save()`
  entity.save();
}

export function handleBattleRoyalePoolReset(
  event: BattleRoyalePoolReset
): void {}

export function handleContractDeployed(event: ContractDeployed): void {}

export function handleDaySet(event: DaySet): void {}

export function handlePickMade(event: PickMade): void {}

export function handleRegistered(event: Registered): void {}

export function handleRegistrationClosed(event: RegistrationClosed): void {}

export function handleRegistrationOpened(event: RegistrationOpened): void {}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleTeamsEliminated(event: TeamsEliminated): void {}

export function handleVersionIncremented(event: VersionIncremented): void {}

export function handleWinnerPaidout(event: WinnerPaidout): void {}
