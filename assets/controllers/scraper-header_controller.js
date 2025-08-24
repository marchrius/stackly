import { Controller } from '@hotwired/stimulus';

/* stimulusFetch: 'lazy' */
export default class extends Controller {
    static targets = ['header', 'button']

    index = null;

    connect() {
        this.index = this.headerTargets.length;
    }

    add(event) {
        event.preventDefault();
        let prototype = this.element.dataset.prototype;
        let newForm = prototype.replace(/__name__/g, this.index);
        this.buttonTarget.insertAdjacentHTML('beforebegin', newForm);
        this.index++;
    }

    remove(event) {
        event.preventDefault();
        event.target.closest('.header').remove();
    }
}
