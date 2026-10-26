import { Component, OnInit, inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UserStateService } from '../../services/user/user-state.service';
import { environment } from '../../../environments/environment';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Modal component for the creation of a permanent link (logged in user)
 */
@Component({
    selector: 'app-permanentlink-form',
    templateUrl: './create-permanentlink.modal.component.html',
    styleUrls: ['./create-permanentlink.modal.component.scss'],
    standalone: false
})
export class CreatePermanentLinkModalComponent implements OnInit {
  private userStateService = inject(UserStateService);
  private formBuilder = inject(UntypedFormBuilder);

  dialogRef = inject(MatDialogRef<CreatePermanentLinkModalComponent>);
  linkForm!: UntypedFormGroup;
  dialogMessage = signal<string>("");
  savingState = signal<boolean>(false);
  errorOccurred = signal<boolean>(false);

  ngOnInit() {
    this.linkForm = this.formBuilder.group({
      name: ['', Validators.required.bind(Validators)],
      description: [''],
      isPublic: [true],
      link: [{ value: '', disabled: true }]
    });
    this.errorOccurred.set(false);
  }

  savePermanentLink() {
    this.linkForm.get('name')?.disable();
    this.linkForm.get('description')?.disable();
    this.linkForm.get('isPublic')?.disable();
    this.savingState.set(true);
    this.userStateService.addState(this.linkForm.get('name')?.value, this.linkForm.get('description')?.value,
        this.linkForm.get('isPublic')?.value, false).subscribe(response => {
      this.errorOccurred.set(false);
      this.savingState.set(false);
      const link = environment.hostUrl + '?state=' + response;
      this.linkForm.get('link')?.setValue(link);
      this.dialogMessage.set('The state has been saved. You can view and manage your permanent links by selecting "Manage Permanent Links" from the user menu.');
      this.userStateService.updateUserStates();
    }, () => {
      this.errorOccurred.set(true);
      this.savingState.set(false);
      this.dialogMessage.set('There was an issue saving state.');
    });
  }

}
