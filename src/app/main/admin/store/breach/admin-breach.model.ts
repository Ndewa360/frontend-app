import { BreachIncident } from '../../services/admin-breach.service';

export interface AdminBreachStateModel {
  incidents: BreachIncident[];
  selectedId: string | null;
  loading: boolean;
  saving: boolean;
}
