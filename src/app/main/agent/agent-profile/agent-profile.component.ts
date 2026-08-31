import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-agent-profile',
  templateUrl: './agent-profile.component.html',
  styles: [`
    .profile-card { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); max-width: 600px; margin: 2rem auto; }
    .section-title { font-size: 1rem; font-weight: 600; color: #333; margin-bottom: 1rem; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: .75rem; cursor: pointer; transition: border-color .2s; }
    .toggle-row:hover { border-color: #6366f1; }
    .toggle-row.active { border-color: #6366f1; background: #f5f3ff; }
    .toggle-label h4 { margin: 0 0 .25rem; font-size: .95rem; font-weight: 600; }
    .toggle-label p { margin: 0; font-size: .8rem; color: #6b7280; }
    .radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .radio-dot.checked { border-color: #6366f1; background: #6366f1; }
    .radio-dot.checked::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
    .save-btn { width: 100%; padding: .75rem; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: .95rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
    .save-btn:disabled { opacity: .6; cursor: not-allowed; }
    .alert { padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-top: .75rem; }
    .alert-success { background: #d1fae5; color: #065f46; }
    .alert-error { background: #fee2e2; color: #991b1b; }
  `]
})
export class AgentProfileComponent implements OnInit {
  contactDisplayMode: 'AGENCY' | 'OWNER' = 'AGENCY';
  saving = false;
  successMsg = '';
  errorMsg = '';
  private userId = '';

  constructor(private http: HttpClient, private store: Store) {}

  ngOnInit(): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    this.userId = profile?._id || '';
    if (this.userId) {
      this.http.get<any>(`${environment.apiUrl}/agents/${this.userId}`).subscribe({
        next: (res) => {
          this.contactDisplayMode = res?.contactDisplayMode || res?.data?.contactDisplayMode || 'AGENCY';
        },
        error: () => {}
      });
    }
  }

  selectMode(mode: 'AGENCY' | 'OWNER'): void {
    this.contactDisplayMode = mode;
    this.successMsg = '';
    this.errorMsg = '';
  }

  save(): void {
    if (!this.userId || this.saving) return;
    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.http.patch<any>(
      `${environment.apiUrl}/agents/${this.userId}/contact-display-mode`,
      { contactDisplayMode: this.contactDisplayMode }
    ).subscribe({
      next: () => {
        this.saving = false;
        this.successMsg = 'Préférence enregistrée avec succès.';
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Erreur lors de la sauvegarde. Veuillez réessayer.';
      }
    });
  }
}
