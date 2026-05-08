import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['input', 'formInput', 'result']

    timeout = null;
    autocompleteElement = null;

    connect() {
        let self = this;

        this.autocompleteElement = M.Autocomplete.init(this.inputTarget, {
            onAutocomplete: function (item) {
                self.onAutocomplete(item)
            },
        });

        if (this.formInputTarget.value.length > 0) {
            let values = JSON.parse(this.formInputTarget.value);
            for (const item of values) {
                this.resultTarget.appendChild(this.getChip(item));
            }
        }
    }

    remove(event) {
        let existingTags = JSON.parse(this.formInputTarget.value);
        let chip = event.target.closest('.chip');
        let index = existingTags.indexOf(chip.dataset.id);

        if (index > -1) {
            existingTags.splice(index, 1);
        }

        this.formInputTarget.value = JSON.stringify(existingTags);
    }

    preventDefault(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            return false;
        }
    }

    autocomplete(event) {
        this.autocompleteElement.setMenuItems({});
        clearTimeout(this.timeout);
        let value = encodeURIComponent(this.inputTarget.value);
        let self = this;

        if (value) {
            this.timeout = setTimeout(function () {
                fetch('/tags/autocomplete/' + value, {
                    method: 'GET'
                })
                .then(response => response.json())
                .then(function(results) {
                    self.autocompleteElement.setMenuItems(results);
                    self.autocompleteElement.open();
                })
            }, 500);
        }

        if (value && event.which === 13) {
            this.onAutocomplete(this.inputTarget.value);
        }
    }

    onAutocomplete(item) {
        let value;
        if (Array.isArray(item)) {
            value = item[0] ? item[0].text : null;
        } else {
            value = item;
        }

        if (!value) {
            return;
        }

        let existingElements = JSON.parse(this.formInputTarget.value);
        let index = existingElements.indexOf(value);
        if (index === -1) {
            existingElements.push(value);
            this.resultTarget.appendChild(this.getChip(value));
        }

        this.formInputTarget.value = JSON.stringify(existingElements);
        this.inputTarget.value = '';
    }

    getChip(label) {
        const div = document.createElement('div');

        div.setAttribute('class', 'chip');
        div.setAttribute('data-id', label);
        div.setAttribute('data-text', label);
        div.textContent = label;

        const i = document.createElement('i');
        i.setAttribute('class', 'fa fa-times close');
        i.setAttribute('data-action', 'click->autocomplete--tag#remove');

        div.appendChild(i);

        return div;
    }
}
