import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();

  constructor() {
    this.initNetworkMonitoring();
  }

  async initNetworkMonitoring() {
    // Estado inicial
    const status = await Network.getStatus();
    this.isOnlineSubject.next(status.connected);

    // Escuchar cambios de red
    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status.connected);
      this.isOnlineSubject.next(status.connected);
    });
  }

  async getCurrentStatus(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }
}
