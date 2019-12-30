import { NotificationsComponent } from './../notifications/notifications.component';
import { AlertController, PopoverController, MenuController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CalendarComponentOptions } from 'ion2-calendar';
import LoadingService from '../providers/loading.service';

@Component({
  selector: 'app-progetti',
  templateUrl: './progetti.page.html',
  styleUrls: ['./progetti.page.scss'],
})
export class ProgettiPage implements OnInit {
  private progetti: Array<Object> = [];
  private progettoSelezionato: string = "";
  public items: Array<Object> = [];
  public visualizzareDipendenti: boolean = false;
  public giorno: string;
  private _color: string = 'primary';

  constructor(private popoverCtrl: PopoverController, private alertController: AlertController,
    private http: HttpClient, private loadingService: LoadingService, private menu: MenuController) { }

  options: CalendarComponentOptions = {
    color: this._color,
    // showMonthPicker: false,
    // showToggleButtons: false,
  };

  ngOnInit() {
    this.loadingService.presentLoading('Aspetta...').then(() => {

      const uid = localStorage.getItem('uid');
      const url = 'https://europe-west1-smart-working-5f3ea.cloudfunctions.net/getProjects';

      this.http.get(url + '?uid=' + uid).subscribe(response => {
        const hasError = response['hasError'];

        if (hasError !== undefined) {
          this.presentAlert('Attenzione', 'Si è verificato un errore. Provare a riaccedere alla pagina');
          return;
        }

        for (let i = 0; i < (response as []).length; i = i + 1) {
          this.progetti.push({
            label: response[i].nome,
            type: 'radio',
            value: response[i].id,
            checked: false
          });
        }

        this.loadingService.dismissLoading();
      });
    });
  }

  async presentAlert(header, message) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: 'OK'
        }
      ]
    });
    await alert.present();
  }

  async mostraProgetti() {
    const alert = await this.alertController.create({
      header: 'Seleziona il progetto',
      inputs: this.progetti,
      cssClass: 'alertClass',
      buttons: [
        {
          text: 'Indietro',
          role: 'cancel',
          cssClass: 'alertDanger',
        }, {
          text: 'Conferma',
          handler: (res) => {
            this.progettoSelezionato = res;

            for (let i = 0; i < this.progetti.length; i = i + 1) {
              if (this.progetti[i]['value'] === res) {
                this.progetti[i]['checked'] = true;
              } else {
                this.progetti[i]['checked'] = false;
              }
            }

            // Se clicca conferma senza selezionare niente il bottone resta disabilitato
            if (res !== undefined) {
              const node = document.querySelector('#btnBloccaGiorno') as HTMLElement;
              node['color'] = 'danger';
              node['disabled'] = false;
            }
            // inoltre l'alert continua ad essere mostrato, così è forzato a premere sul tasto indietro
            else {
              this.mostraProgetti();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async notifications(myEvent) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsComponent,
      event: myEvent,
      animated: true,
      translucent: true
    });

    await popover.present();

    (await popover).onDidDismiss().then((popoverData) => {
      if ((popoverData.data === undefined) || (popoverData.data.scelta === 'annulla') || (popoverData.data.giorno === undefined)) {
        return;
      }

      const giornoArray = popoverData.data.giorno.split(' ');

      const day = giornoArray[1];
      let month = 0;
      switch (giornoArray[2]) {
        case 'Gen': month = 1; break;
        case 'Feb': month = 2; break;
        case 'Mar': month = 3; break;
        case 'Apr': month = 4; break;
        case 'Mag': month = 5; break;
        case 'Giu': month = 6; break;
        case 'Lug': month = 7; break;
        case 'Ago': month = 8; break;
        case 'Set': month = 9; break;
        case 'Ott': month = 10; break;
        case 'Nov': month = 11; break;
        case 'Dic': month = 12; break;
      }
      const year = giornoArray[3];

      this.loadingService.presentLoading('Aspetta...');
      const url = 'https://europe-west1-smart-working-5f3ea.cloudfunctions.net/blockSWDay';

      this.http.get(url + '?project=' + this.progettoSelezionato + '&day=' + day + '&month=' + month + '&year=' + year)
        .subscribe(response => {
          this.loadingService.dismissLoading();

          const hasError = response['hasError'];

          if (hasError === true) {
            this.presentAlert('Errore', 'Errore nel salvare la scelta');
          } else {
            this.presentAlert('Successo', 'Giorno bloccato con successo');
          }
        });
    });
  }

  onChange($event) {
    if (this.progettoSelezionato.length === 0) {
      return;
    }

    const day = $event.split('-');

    let giorno = day[2];
    let mese = day[1];
    let anno = day[0];

    if (giorno[0] == '0') {
      giorno = giorno.replace('0', '');
    }

    this.loadingService.presentLoading('Aspetta...');
    const url = 'https://europe-west1-smart-working-5f3ea.cloudfunctions.net/checkWhoInSW';

    this.http.get(url + '?project=' + this.progettoSelezionato + '&day=' + giorno + '&month=' + mese + '&year=' + anno)
      .subscribe(response => {

        const hasError = response['hasError'];

        if (hasError !== undefined) {
          this.loadingService.dismissLoading();
          this.presentAlert('Attenzione', 'Si è verificato un errore. Provare a riaccedere alla pagina');
          return;
        }

        this.giorno = giorno + '/' + mese + '/' + anno;
        this.items = [];
        for (let i = 0; i < (response as []).length; i = i + 1) {
          this.items.push({
            number: (i + 1) + ')',
            title: response[i].nome + ' ' + response[i].cognome
          });
        }

        if (this.items.length === 0) {
          this.items.push({
            number: '  ',
            title: 'Non ci sono dipendenti in SW'
          });
        }

        this.visualizzareDipendenti = true;
        this.loadingService.dismissLoading();
      });
  }

  // Swipe per il menu laterale
  handleSwipe() {
    this.menu.open();
  }
}
