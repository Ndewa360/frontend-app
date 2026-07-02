import {
  PlatformBalance,
  PlatformKpis,
  PlatformRevenuePeriod,
  PlatformWithdrawal,
  PlatformFinanceConfig,
} from '../../services/admin-platform-finance.service';

export interface PlatformFinanceStateModel {
  balance:           PlatformBalance | null;
  kpis:              PlatformKpis | null;
  revenueData:       PlatformRevenuePeriod[];
  withdrawals:       PlatformWithdrawal[];
  withdrawalsTotal:  number;
  transactions:      any[];
  transactionsTotal: number;
  config:            PlatformFinanceConfig | null;
  loading:           boolean;
  configError:       string | null;
}
