import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-agent-profile',
  template: `
    <div class="agent-profile-container">
      <h1>Mon Profil Agent</h1>
      <p>Composant en cours de développement...</p>
    </div>
  `,
  styles: [`
    .agent-profile-container {
      padding: 2rem;
    }
  `]
})
export class AgentProfileComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}