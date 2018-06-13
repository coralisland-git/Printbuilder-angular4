import { Component, OnInit } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { GlobalService, CardEditorService } from '../../services';
import { ACDialogComponent } from '../ac-dialog/ac-dialog.component';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {
  menuItems: any;
  openedItemClass: any;

  constructor(
    private dialogService: DialogService,
    private globalService: GlobalService,
    private cardEditorService: CardEditorService
  ) {
    this.menuItems = [
      {
        "class": "item-home",
        "text": "Home",
        "link": "/"
      },
      {
        "class": "item-crm",
        "text": "CRM",
        "external_link": true,
        "required_token": "crm_token",
        "link": "https://crm.agentcloud.com/#/dashboard",
        "child_menu": [
          /* {
            "external_link": true,
            "text": "Dashboard",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/dashboard"
          }, */
          {
            "external_link": true,
            "text": "Inbox",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/inbox"
          },
          {
            "external_link": true,
            "text": "To Do List",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/tasks"
          },
          {
            "external_link": true,
            "text": "Property",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/property"
          },
          {
            "external_link": true,
            "text": "Leads",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/leads"
          },
          {
            "external_link": true,
            "text": "Contacts",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/contacts"
          },
          {
            "external_link": true,
            "text": "Circles",
            "required_token": "crm_token",
            "link": "https://crm.agentcloud.com/#/circles"
          }
        ]
      },
      {
        "class": "item-events",
        "text": "Events",
        "external_link": true,
        "link": "https://crm.agentcloud.com/#/events",
        "required_token": "crm_token",
        "child_menu": [
          {
            "text": "Add Event",
            "link": "https://crm.agentcloud.com/#/events/add",
            "required_token": "crm_token",
            "external_link": true
          }
        ]
      },
      {
        "class": "item-printbuilder",
        "text": "Print Builder",
        "link": "/products",
        "child_menu": [
          {
            "text": "View Cart",
            "link": "/checkout"
          }
        ]
      },
      {
        "class": "item-webbuilder",
        "text": "Web Builder",
        "external_link": true,
        "required_token": "crm_token",
        "link": "https://crm.agentcloud.com/#/webbuilder"
      },
      {
        "class": "item-transactions",
        "text": "Transactions",
        "external_link": true,
        "required_token": "crm_token",
        "link": "https://crm.agentcloud.com/#/transactions",
      },
      {
        "class": "item-screencast",
        "text": "ScreenCast",
        "external_link": true,
        "required_token": "crm_token",
        "link": "https://crm.agentcloud.com/#/screencast"
      }
    ];

    this.setActivatedLink();
  }

  ngOnInit() { }

  // if current link is current page
  isActiveLink(link) {
    return this.globalService.isActiveLink(link);
  }

  // redirect to other page
  redirectTo(item, force = false) {
    if (this.cardEditorService.getCardBuildingStatus() && !force) {
      this.dialogService.addDialog(ACDialogComponent, {
        dlgType: "leave-design",
        dlgData: {}
      }).subscribe(result => {
        if (result) {
          this.redirectTo(item, true);
        }
      });
    } else {
      this.openedItemClass = item.class == this.openedItemClass ? "" : item.class;

      let link = item.link;
      if (item.required_token == "crm_token") {
        link += "?sso=true&token=" + this.globalService.getItem("crm_token", false);
      }

      if (link)
        this.globalService.redirectTo(link);
    }
  }

  // set
  setActivatedLink() {
    this.openedItemClass = "";

    setTimeout(() => {
      for (let item of this.menuItems) {
        if (this.openedItemClass)
          break;

        if (this.isActiveLink(item.link))
          this.openedItemClass = item.class
        else if (item.child_menu) {
          for (let childItem of item.child_menu) {
            if (this.isActiveLink(childItem.link))
              this.openedItemClass = item.class;
          }
        }
      }
    });
  }
}
