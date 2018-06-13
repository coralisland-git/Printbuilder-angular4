import { Component, OnInit, ViewChild } from '@angular/core';
import { GlobalService, CardEditorService } from '../../../../services';
import { LoadingIconComponent } from '../../../loading-icon/loading-icon.component';

@Component({
  selector: 'pb-options-panel',
  templateUrl: './options-panel.component.html',
  styleUrls: ['./options-panel.component.css']
})
export class OptionsPanelComponent implements OnInit {
  cardTypeOptions: any;  // card options with the card type, post card options, buisness card options, ...
  cardOptions: any;  // current Card Options
  cardType: string = "";  // card type

  @ViewChild(LoadingIconComponent) loadingIcon: LoadingIconComponent;

  constructor(
    private globalService: GlobalService,
    private cardEditorService: CardEditorService
  ) { }

  ngOnInit() {
    this.cardType = this.cardEditorService.getCardType();
    this.cardTypeOptions = require('../../../../../resources/card_options.json')[this.cardType];
    this.cardOptions = this.cardEditorService.getCardOptions();
    setTimeout(() => {
      if (this.loadingIcon)
        this.loadingIcon.setLoadingIconType("cloud");
    });
  }

  // return true if option have multiple values
  isSelectedOption(value, option) {
    let is_selected: boolean;

    switch (option) {
      case 'paper':
        is_selected = this.cardOptions["paper"] == value;
        break;

      case 'weight':
        is_selected = this.cardOptions["weight"] == value;
        break;

      case 'corner':
        is_selected = this.cardOptions["corner"] == value;
        break;

      case 'finish':
        is_selected = this.cardOptions["finish"] == value;
        break;

      default:
        is_selected = false;
    }

    return is_selected;
  }

  // return classes for the option in html
  getClasses(value, option) {
    let classes: any = [value];

    if (this.isSelectedOption(value, option))
      classes.push('active');

    return classes.join(' ');
  }

  // get paper types
  getPaperList() {
    return Object.keys(this.cardTypeOptions);
  }

  // get card option information based on option field. ex: paper, weight, ...
  getCardOption(option) {
    let value: any;
    switch (option) {
      case 'paper':
        value = this.cardOptions["paper"];
        break;

      case 'weight':
        value = this.cardOptions["weight"];
        break;

      case 'corner':
        value = this.cardOptions["corner"];
        break;

      case 'finish':
        value = this.cardOptions["finish"];
        break;

      default:
        value = null;
    }

    return value;
  }

  // set card option inofrmation based on option field and value. ex. value = 'luxe', option = 'paper'
  setCardOption(value, option) {
    let c_paper: any;
    let c_weight: any;
    let c_corner: any;

    switch (option) {
      case 'paper':
        this.cardOptions["paper"] = value;
        c_paper = this.cardOptions["paper"];

        this.cardOptions["weight"] = this.cardTypeOptions[c_paper].weight;
        c_weight = this.cardOptions["weight"];

        this.cardOptions["corner"] = this.cardTypeOptions[c_paper].corners.length ? this.cardTypeOptions[c_paper].corners[0] : '';
        c_corner = this.cardOptions["corner"];

        if (c_corner && c_corner in this.cardTypeOptions[c_paper].finishes)
          this.cardOptions["finish"] = this.cardTypeOptions[c_paper].finishes[c_corner].length ? this.cardTypeOptions[c_paper].finishes[c_corner][0] : '';
        else
          this.cardOptions["finish"] = "";
        break;

      case 'corner':
        c_paper = this.cardOptions["paper"];
        c_weight = this.cardOptions["weight"];

        this.cardOptions["corner"] = value;
        c_corner = this.cardOptions["corner"];

        if (c_corner && c_corner in this.cardTypeOptions[c_paper].finishes)
          this.cardOptions["finish"] = this.cardTypeOptions[c_paper].finishes[c_corner].length ? this.cardTypeOptions[c_paper].finishes[c_corner][0] : '';
        else
          this.cardOptions["finish"] = "";
        break;

      case 'finish':
        this.cardOptions["finish"] = value;
        break;
    }

    this.updateCardOptions(true);
  }

  // update card options
  updateCardOptions(populateDefaults = false) {
    this.cardEditorService.setCardOptions(this.cardOptions);

    if (populateDefaults) {
      this.cardOptions["base_price"] = "";
      this.cardOptions["base_prices"] = [];
      this.cardOptions["runsize_uuid"] = "";
      this.cardOptions["runsizes"] = [];
      this.cardOptions["turnaround_time_uuid"] = "";
      this.cardOptions["turnaround_times"] = [];
      this.cardOptions["all_turnaround_times"] = [];
      this.cardOptions["shipping_option"] = {};
      this.cardOptions["shipping_options"] = [];

      if (this.is4OverProduct())
        this.cardEditorService.setDefault4OverOptions();
      else
        this.cardEditorService.setPCBasePrices();
    }
  }

  // get available Weight
  getPaperWeight(paper) {
    return this.cardTypeOptions[paper].weight;
  }

  // get available Paper Corners
  getPaperCorners() {
    return this.cardTypeOptions[this.cardOptions["paper"]].corners;
  }

  // get available Paper Finishes
  getPaperFinishes() {
    return this.cardTypeOptions[this.cardOptions["paper"]].finishes[this.cardOptions["corner"]];
  }

  // return current card type is "type"
  isCurrentCardType(type) {
    return this.cardType == type;
  }

  getProductLabel() {
    return this.cardEditorService.getProductLabel();
  }

  setProductLabel(label) {
    this.cardEditorService.setProductLabel(label);
  }

  // is valid 4 over options
  isValid4OverOptions() {
    return (this.cardOptions["runsize_uuid"] !== "" && this.cardOptions["turnaround_time_uuid"] !== "")
  }

  // set runsize
  changeRunsize(runsize_uuid) {
    this.cardOptions = this.cardEditorService.setCardRunsize(null, runsize_uuid);
    this.updateCardOptions();
  }

  // update turnaround time
  changeTurnAroundTime(turnaround_time_uuid) {
    this.cardOptions = this.cardEditorService.setTurnAroundTime(null, turnaround_time_uuid);
    this.updateCardOptions();
  }

  // get base price
  getBasePrice() {
    return Number(this.cardOptions["base_price"] || 0);
  }

  // is 4 over product
  is4OverProduct() {
    return this.cardEditorService.is4OverProduct();
  }

  reFreshPCBasePrices() {
  }
}
