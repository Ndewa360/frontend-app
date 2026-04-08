import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WalletSummary, WalletTransaction, WithdrawalRequest, WithdrawalMethod, PaymentProvider, DepositInitiateResult } from './wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletHttpService {
  private readonly api = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<{ data: WalletSummary }> {
    return this.http.get<{ data: WalletSummary }>(`${this.api}/summary`);
  }

  getTransactions(page = 1, limit = 20): Observable<{ data: { transactions: WalletTransaction[]; total: number } }> {
    return this.http.get<any>(`${this.api}/transactions?page=${page}&limit=${limit}`);
  }

  getRentPayments(page = 1, limit = 20): Observable<{ data: { payments: WalletTransaction[]; total: number } }> {
    return this.http.get<any>(`${this.api}/rent-payments?page=${page}&limit=${limit}`);
  }

  getDeposits(page = 1, limit = 20): Observable<{ data: { deposits: WalletTransaction[]; total: number } }> {
    return this.http.get<any>(`${this.api}/deposits?page=${page}&limit=${limit}`);
  }

  getWithdrawals(page = 1, limit = 10): Observable<{ data: { withdrawals: WithdrawalRequest[]; total: number } }> {
    return this.http.get<any>(`${this.api}/withdrawals?page=${page}&limit=${limit}`);
  }

  requestWithdrawal(amount: number, method: WithdrawalMethod, recipient: string): Observable<{ data: WithdrawalRequest }> {
    return this.http.post<{ data: WithdrawalRequest }>(`${this.api}/withdraw`, { amount, method, recipient });
  }

  initiateDeposit(amount: number, provider: PaymentProvider, phoneNumber?: string, successUrl?: string, cancelUrl?: string): Observable<{ data: DepositInitiateResult }> {
    return this.http.post<{ data: DepositInitiateResult }>(`${this.api}/deposit/initiate`, {
      amount, provider, phoneNumber, successUrl, cancelUrl,
    });
  }
}
