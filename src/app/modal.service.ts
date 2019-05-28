import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modals: any[] = [];

  // This adds a reference to the modal in an array on init of the modal component
  // so we can open the modal when we call the service from the parent component
  add(modal: any) {
      this.modals.push(modal);
  }

  // Remove modal from the array when modal component is destroyed
  remove(id: string) {
      // Filter out based on id
      this.modals = this.modals.filter(x => x.id !== id);
  }

  // Open modal based on id. called from parent component, then targets modal component from array
  open(id: string) {
      // Check for array based on id, then grab the first in the returned array
      let modal: any = this.modals.filter(x => x.id === id)[0];
      modal.open();
  }

  // Close modal based on id
  close(id: string) {
      // Check for array based on id, then grab the first in the returned array
      let modal: any = this.modals.filter(x => x.id === id)[0];
      modal.close();
  }
}
