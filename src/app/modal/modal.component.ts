import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
// Credit to Jason Watmore for this modal framework
export class ModalComponent implements OnInit, OnDestroy {
    @Input() id: string;
    private element: ElementRef['nativeElement'];

    constructor(private modalService: ModalService, private el: ElementRef) {
        // Get this element and assign
        this.element = el.nativeElement;
        // Initialize the modal as hidden
        this.element.style.display = 'none';
    }

    ngOnInit(): void {
        // Need to assign here for element click later
        let modal = this;

        if (!this.id) {
            console.error('Modal must have an id.');
            return;
        }
        document.body.appendChild(this.element);

        // Close modal if user clicks on bg. Can't add on div because then would close if clicked anywhere
        this.element.addEventListener('click', function (e: any) {
            // Targeting class 'modal' and not 'bg' here because 'bg' class is 'behind' hidden by z-index
            if (e.target.className === 'modal') {
                modal.close();
            }
        });

        // Add modal instance to the modal service so it's accessible from parent
        this.modalService.add(this);
    }

    // Remove self from modal service when directive is destroyed
    ngOnDestroy(): void {
        this.modalService.remove(this.id);
        this.element.remove();
    }

    open(): void {
        // Display the modal
        this.element.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    close(): void {
        // Hide the modal
        this.element.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}