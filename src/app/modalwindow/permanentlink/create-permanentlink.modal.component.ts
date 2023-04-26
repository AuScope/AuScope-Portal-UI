import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserStateService } from 'app/services/user/user-state.service';
import { environment } from '../../../environments/environment';

/**
 * Modal component for the creation of a permanent link (logged in user)
 */
@Component({
  selector: 'app-permanentlink-form',
  templateUrl: './create-permanentlink.modal.component.html',
  styleUrls: ['./create-permanentlink.modal.component.scss']
})
export class CreatePermanentLinkModalComponent implements OnInit {

  linkForm: FormGroup;
  dialogMessage: string;
  savingState = false;
  errorOccurred: boolean;

  constructor(private userStateService: UserStateService, private formBuilder: FormBuilder, public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.linkForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      isPublic: [true],
      link: [{value: '', disabled: true}]
    });
    this.errorOccurred = false;
  }

  savePermanentLink() {
    this.linkForm.get('name').disable();
    this.linkForm.get('description').disable();
    this.linkForm.get('isPublic').disable();
    this.savingState = true;
    this.userStateService.addState(this.linkForm.get('name').value, this.linkForm.get('description').value, this.linkForm.get('isPublic').value).subscribe(response => {
      this.errorOccurred = false;
      this.savingState = false;
      const link = environment.hostUrl + '?state=' + response;
      this.linkForm.get('link').setValue(link);
      this.dialogMessage = 'The state has been saved. You can view and manage your permanent links by selecting "Manage Permanent Links" from the user menu.';
      this.userStateService.updateUserStates();
    }, () => {
      this.errorOccurred = true;
      this.savingState = false;
      this.dialogMessage = 'There was an issue saving state.';
    });
  }

}
