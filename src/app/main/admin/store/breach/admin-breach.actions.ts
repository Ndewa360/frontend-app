import { CreateBreachDto, UpdateBreachStatusDto } from '../../services/admin-breach.service';

export namespace AdminBreachAction {
  export class LoadAll {
    static readonly type = '[AdminBreach] Load All';
    constructor(public status?: string) {}
  }
  export class Declare {
    static readonly type = '[AdminBreach] Declare';
    constructor(public dto: CreateBreachDto) {}
  }
  export class UpdateStatus {
    static readonly type = '[AdminBreach] Update Status';
    constructor(public id: string, public dto: UpdateBreachStatusDto) {}
  }
  export class SelectIncident {
    static readonly type = '[AdminBreach] Select Incident';
    constructor(public id: string | null) {}
  }
}
