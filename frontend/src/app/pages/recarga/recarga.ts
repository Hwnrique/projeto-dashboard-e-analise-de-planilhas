import { Component } from '@angular/core';
import { ReportPanel } from '../report-panel/report-panel';

@Component({
  selector: 'app-recarga',
  imports: [ReportPanel],
  template: '<app-report-panel [kind]="\'recarga\'" />',
})
export class Recarga {}
