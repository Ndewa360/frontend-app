import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-agent-properties',
  template: `
    <div class="agent-properties-container">
      <h1>Mes Biens Gérés</h1>
      <p>Composant en cours de développement...</p>
    </div>
  `,
  styles: [`
    .agent-properties-container {
      padding: 2rem;
    }
  `]
})
export class AgentPropertiesComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}