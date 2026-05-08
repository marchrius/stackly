import {Controller} from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['block', 'blocksContainer']

    connect() {
        this.index = this.blockTargets.length;
    }

    add(event) {
        event.preventDefault();
        let prototype = this.element.dataset.prototype;
        let newForm = prototype.replace(/__block_name__/g, this.index);
        this.blocksContainerTarget.insertAdjacentHTML('beforeend', newForm);
        this.index++;
    }

    remove(event) {
        event.preventDefault();
        event.target.closest('.block').remove();
    }
}
