import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserStateService } from 'app/services/user/user-state.service';
import { User } from 'app/models/user.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePermanentLinkModalComponent } from 'app/modalwindow/permanentlink/create-permanentlink.modal.component';

@Component({
    selector: 'app-permanent-link',
    templateUrl: './permanentlink.component.html',
    styleUrls: ['./permanentlink.component.scss'],
    standalone: false
})
export class PermanentLinkComponent {
  public bShowDialog = false;
  public user: User;
  public permanentlink = "";
  public shorteningMode = false;

  constructor(private userStateService: UserStateService, private modalService: NgbModal) {
    this.userStateService.user.subscribe(user => {
      this.user = user;
    });
  }
  
  /**
   * User has clicked permanent link button, show dialog based on whether they're logged in
   */
  public permanentLinkClick() {
    if (this.user) {
      this.showUserPermanentLinkDialog();
    } else {
      this.togglePermanentLinkPanel();
    }
  }

  /**
   * Toggle anonymous user permanent link panel
   */
  public togglePermanentLinkPanel() {
    this.bShowDialog = !this.bShowDialog;
    if (this.bShowDialog){
      this.generateAnonymousPermanentLink();
    }
  }

  /**
   * Generate the permanent link
   */
  public generateAnonymousPermanentLink() {
    this.shorteningMode = true;

    this.userStateService.addState(null, null, true, true).subscribe(response => {
      const link = environment.hostUrl + '?state=' + response;
      this.permanentlink = link;
      this.shorteningMode = false;
    }, () => {
      this.permanentlink = "Error retrieving permanent link."
      this.shorteningMode = false;
    });

  }

  /**
   * Show the create permanent link dialog for a logged in user
   */
  public showUserPermanentLinkDialog() {
    this.modalService.open(CreatePermanentLinkModalComponent, {
      size: 'lg',
      backdrop: false,
      scrollable: true
    });
  }

}
