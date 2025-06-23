import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchPropertyModel } from 'src/app/shared/store';

@Component({
  selector: 'app-search-results-wrapper',
  templateUrl: './search-results-wrapper.component.html',
  styleUrls: ['./search-results-wrapper.component.scss']
})
export class SearchResultsWrapperComponent implements OnInit {
  @Input() properties!: Observable<SearchPropertyModel[]>;
  @Input() loading: boolean = false;
  @Input() showHeader: boolean = true;
  @Input() allowViewToggle: boolean = true;
  @Input() searchQuery: string = '';
  @Input() viewMode: 'grid' | 'list' = 'grid';

  @Output() viewToggled = new EventEmitter<'grid' | 'list'>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() browseAllRequested = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
    // Initialisation du composant
  }

  onToggleView(): void {
    const newView = this.viewMode === 'grid' ? 'list' : 'grid';
    this.viewMode = newView;
    this.viewToggled.emit(newView);
  }

  onResetFilters(): void {
    this.filtersReset.emit();
  }

  onBrowseAll(): void {
    this.browseAllRequested.emit();
  }
}
