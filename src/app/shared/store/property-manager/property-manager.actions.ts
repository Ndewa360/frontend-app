import { ManagedPropertyItem, CreateAndAssignManagerPayload, AssignExistingManagerPayload } from './property-manager.model';

export namespace PropertyManagerAction {

  export class LoadMyAssignments {
    static readonly type = '[PropertyManager] Load My Assignments';
  }

  export class SetManagedProperties {
    static readonly type = '[PropertyManager] Set Managed Properties';
    constructor(public managedProperties: ManagedPropertyItem[]) {}
  }

  export class CreateAndAssign {
    static readonly type = '[PropertyManager] Create And Assign';
    constructor(public payload: CreateAndAssignManagerPayload) {}
  }

  export class AssignExisting {
    static readonly type = '[PropertyManager] Assign Existing';
    constructor(public payload: AssignExistingManagerPayload) {}
  }

  export class LoadManagersForProperty {
    static readonly type = '[PropertyManager] Load Managers For Property';
    constructor(public propertyId: string) {}
  }

  export class UpdatePermissions {
    static readonly type = '[PropertyManager] Update Permissions';
    constructor(public assignmentId: string, public permissions: string[]) {}
  }

  export class RevokeManager {
    static readonly type = '[PropertyManager] Revoke Manager';
    constructor(public assignmentId: string) {}
  }

  export class Reset {
    static readonly type = '[PropertyManager] Reset';
  }
}
