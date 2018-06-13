import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'page-hero',
  templateUrl: './page-hero.component.html',
  styleUrls: ['./page-hero.component.css']
})
export class PageHeroComponent implements OnInit {
  @Input() heroType: string;

  private carouselItems: any;
  private bannerItem: any;

  constructor() { }

  ngOnInit() {
  }

  populateCarouselItems(carouselItems) {
    this.carouselItems = carouselItems;
  }

  populateBannerItem(bannerItem) {
    this.bannerItem = bannerItem;
  }
}
