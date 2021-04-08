import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import {
  TableConfig,
  ActionEvent,
  ActionListValue,
  ActionButtonValue,
  ActionIconValue,
  MenuValue,
  StatusValue,
  PropertyValue,
  TABLE_THEME,
} from './types';

@Component({
  selector: 'lib-resource-table',
  templateUrl: './resource-table.component.html',
  styleUrls: ['./resource-table.component.scss'],
})
export class ResourceTableComponent implements OnInit {
  @Input() config: TableConfig;
  @Input() data: any[];
  @Input() trackByFn: (index: number, r: any) => string;

  // Whenever a button in a row is pressed the component will emit an event
  // with information regarding the button that was pressed as well as the
  // row's object.
  @Output() actionsEmitter = new EventEmitter<ActionEvent>();

  TABLE_THEME = TABLE_THEME;

  constructor() {}

  ngOnInit() {}

  public actionTriggered(e: ActionEvent) {
    // Forward the emitted ActionEvent
    this.actionsEmitter.emit(e);
  }

  public newButtonTriggered() {
    const ev = new ActionEvent('newResourceButton', {});
    this.actionsEmitter.emit(ev);
  }

  public linkClicked(field: string, data: any) {
    const ev = new ActionEvent(`${field}:link`, data);
    this.actionsEmitter.emit(ev);
  }

  get minTableWidth() {
    // Review: This will break if the config is an other falsy value
    // https://developer.mozilla.org/en-US/docs/Glossary/Falsy
    if (typeof this.config === 'undefined') {
      return '600px';
    }

    return `${this.config.columns.length * 100}px`;
  }

  get totalWidth() {
    if (!this.config || !this.config.width) {
      return 'fit-content';
    }

    return this.config.width;
  }

  get tableTheme(): TABLE_THEME {
    if (!this.config || !this.config.theme) {
      return TABLE_THEME.CARD;
    }

    return this.config.theme;
  }
}
