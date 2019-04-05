import {Component} from '@angular/core';
import {NotificationService} from '../../portal-core-ui/service/toppanel/notification.service';


@Component({
  selector: '[app-notification]',
  templateUrl: './notification.component.html'
})
export class NotificationComponent {
  notifications: Notification[];
  result: String;

  constructor(private notificationService: NotificationService) {
  }


  onGetNotifications() {
    this.notificationService.getNotifications()
      .subscribe(
      (data: any[]) => {this.notifications = data['data']; },
      (error) => {console.log('Error with retrieving notification!'); }
      );
  }
}

interface Notification {
  content: string,
  author: string,
  time: string
}
