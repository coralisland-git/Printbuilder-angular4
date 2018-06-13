import { Component } from '@angular/core'
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { CardEditorService, UserInfoService } from '../../services';

declare let $;

export interface DialogInterface {
	dlgData: any,
	dlgType: string
}

@Component({
	templateUrl: './ac-dialog.component.html',
	styleUrls: ['./ac-dialog.component.css']
})
export class ACDialogComponent extends DialogComponent<DialogInterface, any> implements DialogInterface {
	dlgType: string;
	dlgData: any;

	private sizeLabel: string = "jumbo";
	saveAsDraft: boolean = false;
	csvTabIndex: any = 0;

	userInfo: any;
	private isUserInfoPopulated: boolean = false;

	constructor(
		dialogService: DialogService,
		private cardEditorService: CardEditorService,
		private userInfoService: UserInfoService
	) {
		super(dialogService);

		let that = this;
		let interval = setInterval(() => {
			that.userInfo = JSON.parse(JSON.stringify(that.userInfoService.getUserInfo()));
			if (JSON.stringify(that.userInfo) !== JSON.stringify(that.userInfoService.getInitUserInfo())) {
				this.isUserInfoPopulated = true;
				clearInterval(interval);
			}
		})
	}

	getSizes() {
		return this.cardEditorService.getCardSizes(this.dlgData.cardType);
	}

	// ok method
	confirm() {
		switch (this.dlgType) {
			case "single-product":
				this.result = true;
				this.cardEditorService.setCardType(this.dlgData.cardType);
				this.cardEditorService.setCardSizeLabel(this.sizeLabel);
				this.cardEditorService.setExistingCard(false);
				this.cardEditorService.setCardLayout("horizontal");
				this.cardEditorService.setPBRightStep("front-builder");
				this.cardEditorService.setPBLeftStep("templates-panel");
				break;

			case "review-order":
				this.result = {
					saveAsDraft: this.saveAsDraft
				}
				break;

			case "import-contacts":
				break;

			case "shipping-billing":
				this.userInfoService.setUserInfo(this.userInfo);
			default:
				this.result = true;
				break;
		}

		this.close();
	}

	// cancel method
	cancel() {
		this.result = false;
		this.close();
	}

	// return modal title
	getModalTitle() {
		let text = "Modal Dialog";

		switch (this.dlgType) {
			case "single-product":
				text = this.dlgData.cardType + " cards";
				break;

			case "review-order":
				text = "To Checkout";
				break;

			case "import-contacts":
				text = "Import Contacts";
				break;

			case "terms-of-use":
				text = "Terms of Use";
				break;

			case "leave-design":
				text = "Confirm";
				break;

			case "shipping-billing":
				text = "Shipping & Billing Information";
				break;
		}

		return text;
	}

	// return button text
	getOKButtonText() {
		let text = "OK";

		switch (this.dlgType) {
			case "single-product":
				text = "Proceed";
				break;

			case "terms-of-use":
				text = "Accept Terms";
				break;

			case "shipping-billing":
				text = "Save";
				break;

			case "review-order":
			case "leave-design":
			default:
				text = "Yes";
				break;
		}

		return text;
	}

	// return button text
	getCancelButtonText() {
		let text = "Cancel";
		switch (this.dlgType) {
			case "terms-of-use":
				text = "Decline";
				break;

			case "shipping-billing":
				text = "Cancel";
				break;

			case "review-order":
			case "leave-design":
			default:
				text = "No";
				break;
		}

		return text;
	}

	// check dlg type
	checkDlgType(dlgType) {
		return dlgType == this.dlgType;
	}

	// get user full name
	getUserFullName() {
		return this.userInfoService.getFullName();
	}

	// download csv template
	downloadCSVTemplate() {
		window.open("/assets/csv-template/direct mailer template.csv");
		this.csvTabIndex = 1;
	}

	// open file uploader
	openCSVUploader() {
		$("#csv-uploader").click();
	}

	// react CSV Data
	readCSVData(evt) {
		let csvFile = evt.target.files[0];

		let reader = new FileReader();
		reader.readAsText(csvFile);

		reader.onload = (f) => {
			let target: any = f.target;
			let csvData = target.result;

			let allTextLines = csvData.split(/\r\n|\n/);
			let headers = allTextLines[0].split(',');
			let csvContent = [];

			for (let i = 0; i < allTextLines.length; i++) {
				let data = allTextLines[i].split(',');
				if (data.length == headers.length) {
					let tmp = [];

					for (let j = 0; j < headers.length; j++) {
						tmp.push(data[j]);
					}

					csvContent.push(tmp);
				}
			}

			csvContent.shift();

			this.result = {
				csvFile: csvFile,
				contacts: csvContent
			};

			this.confirm();
		}
	}

	// information is populated
	hideShippingBilling() {
		if (this.dlgType !== "shipping-billing")
			return false;

		if (this.isUserInfoPopulated) {
			if (!this.userInfoService.isShippingBillingOK())
				return false;
			else
				this.cancel();
		}

		return true;
	}
	// shipping info is populated
	isAllShippingBillingInputed() {
		if (!this.userInfoService.isValid(this.userInfo["first_name"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["last_name"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["address"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["city"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["state"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["zipcode"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["email"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_company"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_first_name"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_last_name"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_address"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_city"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_state"]))
			return false;

		if (!this.userInfoService.isValid(this.userInfo["shipping_zipcode"]))
			return false;

		return true;
	}
}
