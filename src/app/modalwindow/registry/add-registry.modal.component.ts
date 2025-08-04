import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Registry } from 'app/menupanel/data-explorer/data-model';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'environments/environment';

declare let gtag: Function;

@Component({
    selector: 'add-registry-modal-window',
    templateUrl: './add-registry.modal.component.html',
    styleUrls: ['./add-registry.component.scss'],
    standalone: false
})
export class AddRegistryModalComponent implements OnInit, AfterViewInit {

  @ViewChild('nameField') nameField: ElementRef;

  overrideRecordUrl = false;

  // Service form
  registryForm: FormGroup = new FormGroup({
    name: new FormControl('', [ Validators.required.bind(Validators) ]),
    serviceUrl: new FormControl('', [ Validators.required.bind(Validators) ]),
    recordUrl: new FormControl({ value: '', disabled: true }, [ Validators.required.bind(Validators) ]),
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
        this.registryForm.patchValue({ recordUrl: url });
      }
    });
    // Enable/disable record URL, attempt to build record URL if disabled
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
   * Focus name field by default
   */
  ngAfterViewInit() {
    this.nameField.nativeElement.focus();
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
    if (environment.googleAnalyticsKey && typeof gtag === 'function') {
      gtag('event', 'AddCustomRegistry', {
        event_category: 'AddCustomRegistry',
        event_action: 'AddCustomRegistry:' + this.registryForm.get('serviceUrl').value
      });
    }
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

  /**
   * If the user presses Enter when in a text field and the form is valid, save registry
   */
  public onEnter() {
    if (this.registryForm.valid) {
      this.saveRegistry();
    }
  }

}
