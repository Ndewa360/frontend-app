import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TourGuideService {

  startTour(steps: any[], tourId: string) {
  }

  private hasTourBeenSeen(tourId: string): boolean {
    return localStorage.getItem(`tour_${tourId}`) === 'seen';
  }

  private markTourAsSeen(tourId: string): void {
    localStorage.setItem(`tour_${tourId}`, 'seen');
  }

  resetTour(tourId: string): void {
    localStorage.removeItem(`tour_${tourId}`);
  }

  startUserDetailsTour() {
  }
}