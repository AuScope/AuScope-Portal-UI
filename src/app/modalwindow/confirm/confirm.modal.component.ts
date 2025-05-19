import { Component, Input,  } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Reusable confirmation dialog class
 */
@Component({
    selector: 'app-confirm-modal',
    templateUrl: './confirm.modal.component.html',
    styleUrls: ['./confirm.modal.component.scss'],
    standalone: false
})
export class ConfirmModalComponent {

  @Input() title: string;
  @Input() modalContent: string;
  @Input() confirmButtonText: string;
  @Input() cancelButtonText: string;

  constructor(public activeModal: NgbActiveModal) {}

}
