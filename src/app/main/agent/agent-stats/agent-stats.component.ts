import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-agent-stats',
  template: `
    <div class="agent-stats-container">
      <h1>Mes Statistiques</h1>
      <p>Composant en cours de développement...</p>
    </div>
  `,
  styles: [`
    .agent-stats-container {
      padding: 2rem;
    }
  `]
})
export class AgentStatsComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}