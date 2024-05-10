import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserStateService } from 'app/services/user/user-state.service';
import { User } from 'app/models/user.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePermanentLinkModalComponent } from 'app/modalwindow/permanentlink/create-permanentlink.modal.component';

@Component({
  selector: 'app-permanent-link',
  templateUrl: './permanentlink.component.html',
  styleUrls: ['./permanentlink.component.scss']
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
  
  public togglePermanentLinkPanel(){
    this.bShowDialog = !this.bShowDialog;
    if (this.bShowDialog){
      this.generateAnonymousPermanentLink();
    }
    return;
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
      this.permanentlink = "Error on retrieving permanentLink!"
      this.shorteningMode = false;
    });

  }

  /**
   * Show the create permanent link dialog for a logged in user
   */
  public showPermanentLinkDialog() {
    this.modalService.open(CreatePermanentLinkModalComponent, {
      size: 'lg',
      backdrop: false
    });
  }

}
