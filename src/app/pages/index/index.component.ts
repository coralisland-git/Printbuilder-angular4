import { Component, OnInit, ViewChild } from '@angular/core';
import { PageHeroComponent } from '../../components/page-hero/page-hero.component';
import { GlobalService } from '../../services'

@Component({
  selector: 'index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  @ViewChild(PageHeroComponent) pageHero: PageHeroComponent;

  boxItems: any;

  constructor(
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.populateCarouselItems();
    this.populateBoxItems();
  }

  // populate carousel Items
  populateCarouselItems() {
    this.pageHero.populateCarouselItems([{
      id: "welcome",
      slogan: {
        start: "Welcome to",
        end: "",
        feature: "AgentCloud",
        badgeText: "Beta Test"
      },
      summary: "All the real estate marketing tools you need are now at your fingertips. Each feature is designed to streamline your agency operations, one task at a time. It’s as easy as opening the front door.",
      imgURL: "/assets/images/Agent Cloud_01 Welcome.jpg",
    }, {
      id: "printbuilder",
      slogan: {
        start: "How",
        end: "Works",
        feature: "Print Builder",
        badgeText: ""
      },
      summary: "Print Builder is designed to help you boost your agency exposure with premium print marketing materials. Use pre - made, customizable templates to create brochures, flyers, postcards, business cards, and other print materials.",
      imgURL: "/assets/images/Agent Cloud_02 Print Builder.jpg",
    }, {
      id: "crm",
      slogan: {
        start: "How",
        end: "Works",
        feature: "CRM",
        badgeText: ""
      },
      summary: "Agent Cloud CRM allows you to improve informational organization across your agency for greater efficiency. Customize the platform and streamline your real estate pipeline for quicker, better service. No more one-size-fits all CRM.",
      imgURL: "/assets/images/Agent Cloud_03 CRM.jpg",
    }, {
      id: "events",
      slogan: {
        start: "How",
        end: "Works",
        feature: "Events",
        badgeText: ""
      },
      summary: "With Calendar, event management has never been so easy. Input detailed information about your appointments and toggle between different calendar types across teams and departments.",
      imgURL: "/assets/images/Agent Cloud_04 Calendar.jpg",
    }]);
  }

  // populate box Items
  populateBoxItems() {
    this.boxItems = [{
      id: "leads",
      title: "CRM",
      imgURL: "/assets/images/home-icon1.png",
      link: "https://crm.agentcloud.com/#/dashboard",
      required_token: "crm_token"
    }, {
      id: "print-builder",
      title: "Print Builder",
      imgURL: "/assets/images/home-icon2.png",
      link: "/products"
    }, {
      id: "events",
      title: "Events",
      imgURL: "/assets/images/home-icon6.png",
      link: "https://crm.agentcloud.com/#/events",
      required_token: "crm_token"
    }, {
      id: "email-marketing",
      title: "Email Marketing",
      imgURL: "/assets/images/home-icon4.png",
      link: ""
    }, {
      id: "transactions",
      title: "Transactions Management",
      imgURL: "/assets/images/home-icon5.png",
      link: ""
    }, {
      id: "website-builder",
      title: "Website Builder",
      imgURL: "/assets/images/home-icon3.png",
      link: ""
    }]
  }

  redirectTo(box) {
    let link = box.link;

    if (box.required_token == "crm_token") {
      let token = this.globalService.getItem("crm_token", false);
      if (token)
        link += "?sso=true&token=" + this.globalService.getItem("crm_token", false);
    }

    this.globalService.redirectTo(link);
  }

  getCommingSoon(id) {
    return ["email-marketing", "transactions", "website-builder"].indexOf(id) !== -1;
  }
}
