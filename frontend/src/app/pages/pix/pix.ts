import { Component } from '@angular/core';
import { ReportPanel } from '../report-panel/report-panel';

@Component({
  selector: 'app-pix',
  imports: [ReportPanel],
  template: '<app-report-panel [kind]="\'pix\'" />',
})
export class Pix {}
