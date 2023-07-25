import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Registry } from 'app/menupanel/data-explorer/data-model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'add-registry-modal-window',
  templateUrl: './add-registry.modal.component.html',
  styleUrls: ['./add-registry.component.scss']
})
export class AddRegistryModalComponent implements OnInit {

  overrideRecordUrl = false;

  // Service form
  registryForm: FormGroup = new FormGroup({
    name: new FormControl('', [ Validators.required ]),
    serviceUrl: new FormControl('', [ Validators.required ]),
    recordUrl: new FormControl({value: '', disabled: true}, [ Validators.required ]),
    overrideRecordUrl: new FormControl(false)
  });

  constructor(public activeModal: NgbActiveModal) {}

  /**
   * Used to set default service type
   */
  ngOnInit() {
    // Update the record URL if service URL is of valid form and user hasn't chosen to override
    this.registryForm.get('serviceUrl').valueChanges.subscribe(url => {
      if (this.registryForm.get('overrideRecordUrl').value === false) {
        url = this.constructRecordInfoUrl(url);
        this.registryForm.patchValue({recordUrl: url});
      }
    });
    this.registryForm.get('overrideRecordUrl').valueChanges.subscribe(override => {
      if (override) {
        this.registryForm.get('recordUrl').enable();
      } else {
        this.registryForm.get('recordUrl').disable();
        this.registryForm.patchValue({
          recordUrl: this.constructRecordInfoUrl(this.registryForm.get('serviceUrl').value)
        });
      }
    });
  }

  /**
   * Construct a record URL from the supplied Service URL
   *
   * @param url the Service URL
   * @returns a record URL built from the Service URL if the conditions are met,
   * or the original service URL if not
   */
  private constructRecordInfoUrl(url: string): string {
    // Remove any parameters
    if (url.indexOf('?') !== -1) {
      url = url.substring(0, url.indexOf('?'));
    }
    // Remove any trailing slash
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    // If it ends with "csw" replace this with the catalog.search#/metatadata/fileId fragment
    if (url.endsWith('/csw')) {
      url = url.substring(0, url.length - 3) + 'catalog.search#/metadata/%1$s';
    }
    return url;
  }

  /**
   * Add registry to registry list
   */
  saveRegistry() {
    const id = uuidv4();
    const registry: Registry = {
      id: 'user-registry-' + id,
      title: this.registryForm.get('name').value,
      serviceUrl: this.registryForm.get('serviceUrl').value,
      recordUrl: this.registryForm.get('recordUrl').value,
      type: 'Default',
      checked: true,
      startIndex: 1,
      prevIndices: [],
      recordsMatched: 0,
      searching: false,
      currentPage: 1
    }
    this.activeModal.close(registry);
  }

}
