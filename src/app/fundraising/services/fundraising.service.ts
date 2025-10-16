import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface DonationData {
  amount: number;
  name: string;
  email: string;
  message?: string;
}

export interface CampaignStats {
  totalRaised: number;
  donorsCount: number;
  daysLeft: number;
  percentageReached: number;
}

@Injectable({
  providedIn: 'root'
})
export class FundraisingService {
  private campaignStatsSubject = new BehaviorSubject<CampaignStats>({
    totalRaised: 0,
    donorsCount: 0,
    daysLeft: 30,
    percentageReached: 0
  });

  public campaignStats$ = this.campaignStatsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCampaignStats();
  }

  private loadCampaignStats(): void {
    const mockStats: CampaignStats = {
      totalRaised: 0,
      donorsCount: 0,
      daysLeft: 30,
      percentageReached: 0
    };
    this.campaignStatsSubject.next(mockStats);
  }

  submitDonation(donationData: DonationData): Observable<any> {
    console.log('Donation submitted:', donationData);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          transactionId: 'TXN_' + Date.now(),
          message: 'Donation processed successfully'
        });
        observer.complete();
      }, 2000);
    });
  }

  updateStatsAfterDonation(amount: number): void {
    const currentStats = this.campaignStatsSubject.value;
    const newStats: CampaignStats = {
      ...currentStats,
      totalRaised: currentStats.totalRaised + amount,
      donorsCount: currentStats.donorsCount + 1,
      percentageReached: ((currentStats.totalRaised + amount) / 5000000) * 100
    };
    this.campaignStatsSubject.next(newStats);
  }
}