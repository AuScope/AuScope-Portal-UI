import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermanentLink } from 'app/models/permanentlink.model';
import { UserStateService } from 'app/services/user/user-state.service';
import { environment } from '../../../environments/environment';
import { ConfirmModalComponent } from '../confirm/confirm.modal.component';

/**
 * Modal component used to display a user's permanent links
 */
@Component({
    selector: 'app-state-form',
    templateUrl: './permanentlinks.modal.component.html',
    styleUrls: ['./permanentlinks.modal.component.scss'],
    providers: [DatePipe],
    standalone: false
})
export class PermanentLinksModalComponent implements OnInit {

  private userStates: PermanentLink[];
  private userId: string;

  // Keep track of load state links so we can pass through button container's clicks
  @ViewChildren('loadStateLink') loadStateLinks: QueryList<ElementRef<HTMLElement>>;

  statesForm: UntypedFormGroup;
  statesFormArray: UntypedFormArray;

  editingState: number = -1; // Keep track of state being edited (-1 = none)

  constructor(private formBuilder: UntypedFormBuilder, private modalService: NgbModal, public activeModal: NgbActiveModal,
              private userStateService: UserStateService, private datePipe: DatePipe) {}

  ngOnInit() {
    this.userStateService.user.subscribe(user => {
      if (user) {
        this.userId = user.id;
      } else {
        this.userId = undefined;
      }
    });
    this.userStateService.states.subscribe(states => {
      this.statesFormArray = new UntypedFormArray([]);
      this.userStates = states;
      // Close if empty (only happens after delete)
      if (this.userStates.length === 0) {
        this.activeModal.close();
      }
      for (const state of this.userStates) {
        this.statesFormArray.push(this.addStateToFormArray(state));
      }
    });
  }

  /**
   * Add a state FormGroup
   *
   * @param state the state
   * @returns a form control for the state
   */
  addStateToFormArray(state: PermanentLink): AbstractControl {
    const linkUrl = environment.hostUrl + '?state=' + state.id;
    return this.formBuilder.group({
      id: state.id,
      name: [{ value: state.name, disabled: true }, Validators.required.bind(Validators)],
      description: [{ value: state.description, disabled: true }],
      date: [{ value: this.datePipe.transform(state.creationDate, 'medium'), disabled: true }],
      state: state.jsonState,
      isPublic: [{ value: state.isPublic, disabled: true }, Validators.required.bind(Validators)],
      link: [{ value: linkUrl, disabled: true }]
    });
  }

  /**
   * Delete a state
   *
   * @param stateNo the state number in the form array
   */
  deleteState(stateNo: number) {
    console.log('Delete stateNo: ' + stateNo);
    // Confirm delete
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      size: 'sm',
      backdrop: false
    });
    modalRef.componentInstance.title = 'Confirm Delete';
    modalRef.componentInstance.modalContent = 'Are you sure you wish to delete this state?';
    modalRef.componentInstance.cancelButtonText = 'Cancel';
    modalRef.componentInstance.confirmButtonText = 'Delete';
    await modalRef.result.then(result => {
      if (result && result === 'OK') {
        const stateId = this.userStates[stateNo].id;
        this.userStateService.removeState(stateId).subscribe(() => {
          this.userStateService.updateUserStates();
        }, err => {
          alert('Error removing state: ' + err.message);
        });
      }
    });
  }

  /**
   * Trigger a load state link click (so we can pass through container button clicks)
   *
   * @param stateNo the state number in the form array
   */
  loadState(stateNo: number) {
    this.loadStateLinks.toArray()[stateNo].nativeElement.click();
  }

  /**
   * Enable state editing for fields that can edited (name, description, isPublic)
   *
   * @param stateNo the FormArray index of the state
   * @param allowEdit state can edited if true, cannot if false
   */
  enableStateFormControls(stateNo: number, allowEdit: boolean) {
    if (allowEdit) {
      this.statesFormArray.controls[stateNo].get('name').enable();
      this.statesFormArray.controls[stateNo].get('description').enable();
      this.statesFormArray.controls[stateNo].get('isPublic').enable();
    } else {
      this.statesFormArray.controls[stateNo].get('name').disable();
      this.statesFormArray.controls[stateNo].get('description').disable();
      this.statesFormArray.controls[stateNo].get('isPublic').disable();
    }
  }

  /**
   * Enable a state for editing
   *
   * @param stateNo
   */
  editState(stateNo: number) {
    if (stateNo !== this.editingState) {

      if (this.editingState !== -1 && this.statesFormArray.controls[this.editingState].dirty) {
        const modalRef = this.modalService.open(ConfirmModalComponent, {
          size: 'sm',
          backdrop: false
        });
        modalRef.componentInstance.title = 'Save Changes';
        modalRef.componentInstance.modalContent = 'You have unsaved changes, do you wish to save?';
        modalRef.componentInstance.cancelButtonText = 'Cancel';
        modalRef.componentInstance.confirmButtonText = 'Save';
        await modalRef.result.then(result => {
          if (result && result === 'OK') {
           this.saveState(this.editingState);
           this.editingState = -1;
           this.editState(stateNo);
          }
        });
      } else {

        if (this.editingState !== -1) {
          // TODO: Prompt unsaved changes (if any)
          this.enableStateFormControls(this.editingState, false);
        }
        this.editingState = stateNo;
        this.enableStateFormControls(stateNo, true);
      }
    }
  }

  /**
   * Update a state
   *
   * @param stateNo the index of the state in the state FormArray
   */
  public saveState(stateNo: number) {
    if (stateNo === this.editingState) {
      const id = this.statesFormArray.controls[this.editingState].get('id').value;
      const name = this.statesFormArray.controls[this.editingState].get('name').value;
      const description = this.statesFormArray.controls[this.editingState].get('description').value;
      const isPublic = this.statesFormArray.controls[this.editingState].get('isPublic').value;
      this.userStateService.updateState(id, this.userId, name, description, isPublic).subscribe(() => {
        this.enableStateFormControls(stateNo, false);
        this.editingState = -1;
        this.statesFormArray.controls[stateNo].markAsPristine();
      }, err => {
        alert('Error updating state: ' + err.message);
      });
    }
  }

  public close() {
    if (this.editingState !== -1 && this.statesFormArray.controls[this.editingState].dirty) {
      const modalRef = this.modalService.open(ConfirmModalComponent, {
        size: 'sm',
        backdrop: false
      });
      modalRef.componentInstance.title = 'Unsaved Changes';
      modalRef.componentInstance.modalContent = 'You have unsaved changes, do you wish to continue without saving?';
      modalRef.componentInstance.cancelButtonText = 'Cancel';
      modalRef.componentInstance.confirmButtonText = 'OK';
      await modalRef.result.then(result => {
        if (result && result === 'OK') {
         this.activeModal.close();
        }
      });
    } else {
      this.activeModal.close();
    }
  }

}
