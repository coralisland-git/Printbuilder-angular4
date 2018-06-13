import { Component, OnInit, ViewChild } from '@angular/core';

import { DialogService } from 'ng2-bootstrap-modal';
import { CardEditorService, GlobalService, UserInfoService } from '../../services';

import { PageHeroComponent, ACDialogComponent } from '../../components';

declare var $;
declare var Waypoint;

@Component({
  selector: 'products-viewer',
  templateUrl: './products-viewer.component.html',
  styleUrls: ['./products-viewer.component.css']
})
export class ProductsViewerComponent implements OnInit {

  @ViewChild(PageHeroComponent) pageHero: PageHeroComponent;

  sectionItems: any;
  essentialItems: any;

  constructor(
    private dialogService: DialogService,
    private cardEditorService: CardEditorService,
    private globalService: GlobalService,
    private userInfoService: UserInfoService
  ) {
  }

  ngOnInit() {
    this.populateBannerItem();
    this.populateSectionItems();
    this.populateEseentialItems();

    this.createWayPointsPill();

    if (!this.userInfoService.isShippingBillingOK()) {
      setTimeout(() => {
        this.dialogService.addDialog(ACDialogComponent, {
          dlgType: "shipping-billing",
          dlgData: {}
        }).subscribe(result => {
        });
      });
    }
  }

  // populate banner item information
  populateBannerItem() {
    this.pageHero.populateBannerItem({
      slogan: "Print building for your real estate marketing needs",
      summary: "Real estate agents and brokers depend on marketing materials to help attract new clients and drive business growth. With Agent Cloud’s intuitive Print Builder, you’ll have access to a comprehensive suite of graphic design tools that allow you to create brochures, fliers, postcards, business cards, and other print materials quickly.",
      imgURL: "/assets/images/laptop.png",
      imageType: "feature"
    });
  }

  // populate section items information
  populateSectionItems() {
    this.sectionItems = [{
      id: "listing",
      summary: "Printable real estate listing are an essential component to promoting your property listings. Print Builder provides a variety of pre-built templates for all your listing essentials. Create stunning postcards, flyers, and business cards to attract buyers. Use these ready-made designs to highlight pictures, prices, and details of your property listings."
    }, {
      id: "prospecting",
      summary: "Prospecting allows you to keep a steady flow of listings, and print materials keep you prepared for a potential opportunity, anytime, anywhere. Active   involves speaking to potential clients directly. Always be prospect-ready with a folder of goodies to give away. Business cards, Seller’s Guides, Brochures, and other materials help them remember you long after you’ve walked away."
    }, {
      id: "branding",
      summary: "Branding is crucial to any business. Through the power of branding, you’ll be able to successfully differentiate your real estate agencies from others. Your branding embodies your personality, unique value proposition, and business style. The secret behind any real estate branding strategy is design and messaging. The right print materials help you properly convey your brand aesthetic to potential clients. Created branded Buyer Checklists, Mortgage Explainers, Listings, Open House flyers, and much more."
    }, {
      id: "all",
      summary: ""
    }]
  }

  // create waypoints for scrolling
  createWayPointsPill() {
    // make fixed pill when scroll top is 65
    $(window).scroll(function () {
      var nav = $('.nav-pills');
      if (nav.offset()) {
        var scrollTop = $(window).scrollTop();
        var distance = $("#banner").height() + 65; //65 is top bar

        if (scrollTop > distance)
          nav.addClass('fixed');
        else
          nav.removeClass('fixed');
      }
    });

    let interval = setInterval(() => {
      if ($(".nav-pills .nav-link").length == 3) {
        clearInterval(interval);

        for (let item of this.sectionItems) {
          $("#" + item.id + "-link").click(function (event) {
            $(".nav-pills .nav-link.active").removeClass("active");
            $("#" + item.id + "-link").addClass("active");

            event.preventDefault();
            var hash = this.hash;

            Waypoint.disableAll();

            $("html, body").animate({
              scrollTop: $("#" + item.id).offset().top
            }, 800, () => {
              Waypoint.enableAll();
            })
          });

          $("#" + item.id).waypoint({
            handler: (direction) => {
              $(".nav-pills .nav-link.active").removeClass("active");
              $("#" + item.id + "-link").addClass("active");
            },
            offset: 100
          });
        }
      }
    });
  }

  // populate eseentials items
  populateEseentialItems() {
    this.essentialItems = [{
      id: "post",
      title: "PostCards",
      imgURL: "/assets/images/product-post.jpg",
      categories: ["listing", "prospecting"]
    }, {
      id: "business",
      title: "Business Cards",
      imgURL: "/assets/images/product-business.jpg",
      categories: ["branding"],
      coming_soon: false
    }, {
      id: "flyer",
      title: "Flyers",
      imgURL: "/assets/images/product-flyer.jpg",
      categories: ["prospecting"],
      coming_soon: true
    }, {
      id: "brochures",
      title: "Brochures",
      imgURL: "/assets/images/product-brochure.jpg",
      categories: ["prospecting"],
      coming_soon: true
    }, {
      id: "door-hanger",
      title: "Door Hanger",
      imgURL: "/assets/images/product-door-hanger.jpg",
      categories: ["prospecting"],
      coming_soon: true
    }, {
      id: "letterhead",
      title: "Letterhead",
      imgURL: "/assets/images/product-letterhead.jpg",
      categories: ["branding"],
      coming_soon: true
    }];
  }

  // return filtered essential items
  getFilteredEssentialItems(category) {
    if (category == "all")
      return this.essentialItems;

    return this.essentialItems.filter(item => item.categories.indexOf(category) !== -1);
  }

  // redirect to single product
  redirectToSingleProduct(imgURL, cardType) {
    if (cardType == "business") {
      this.cardEditorService.setCardType("business");
      this.cardEditorService.setCardSizeLabel("jumbo");
      this.cardEditorService.setExistingCard(false);
      this.cardEditorService.setCardLayout("horizontal");
      this.cardEditorService.setPBRightStep("front-builder");
      this.cardEditorService.setPBLeftStep("templates-panel");

      this.globalService.redirectTo('/products/single-product');

      return true;
    }

    setTimeout(() => {
      this.dialogService.addDialog(ACDialogComponent, {
        dlgType: "single-product",
        dlgData: {
          "imgURL": imgURL,
          "cardType": cardType
        }
      }).subscribe(result => {
        if (result)
          this.globalService.redirectTo('/products/single-product');
      });
    })
  }

  // return is coming soon
  isComingSoon(item) {
    return this.globalService.isLiveSite() && item["coming_soon"];
  }
}
