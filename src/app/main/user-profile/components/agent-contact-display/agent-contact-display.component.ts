import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

export type ContactDisplayMode = 'AGENCY' | 'OWNER';

@Component({
  selector: 'app-agent-contact-display-settings',
  templateUrl: './agent-contact-display.component.html',
  styleUrls: ['./agent-contact-display.component.scss']
})
export class AgentContactDisplaySettingsComponent implements OnInit {
  @Input() userId = '';

  isAgent = false;
  loading = true;
  contactDisplayMode: ContactDisplayMode = 'AGENCY';
  agencyDisplayName = '';
  saving = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (!this.userId) {
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/agents/${this.userId}`).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        if (data && (data.status || data.businessName || data.contactDisplayMode)) {
          this.isAgent = true;
          this.contactDisplayMode = data?.contactDisplayMode || 'AGENCY';
          this.agencyDisplayName = data?.businessName || '';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectMode(mode: ContactDisplayMode): void {
    this.contactDisplayMode = mode;
    this.successMsg = '';
    this.errorMsg = '';
  }

  get isSaving(): boolean {
    return this.saving;
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
        this.successMsg = this.translate.instant('AGENT_CONTACT_DISPLAY.SAVED');
      },
      error: () => {
        this.saving = false;
        this.errorMsg = this.translate.instant('AGENT_CONTACT_DISPLAY.SAVE_ERROR');
      }
    });
  }

  previewInitials(): string {
    return this.contactDisplayMode === 'OWNER' ? 'PC' : 'AG';
  }

  previewName(): string {
    return this.contactDisplayMode === 'OWNER'
      ? this.translate.instant('AGENT_CONTACT_DISPLAY.PREVIEW_OWNER_NAME')
      : (this.agencyDisplayName || this.translate.instant('AGENT_CONTACT_DISPLAY.PREVIEW_AGENCY_NAME'));
  }

  previewSubtitle(): string {
    return this.contactDisplayMode === 'OWNER'
      ? this.translate.instant('AGENT_CONTACT_DISPLAY.PREVIEW_OWNER_SUBTITLE')
      : this.translate.instant('AGENT_CONTACT_DISPLAY.PREVIEW_AGENCY_SUBTITLE');
  }
}
