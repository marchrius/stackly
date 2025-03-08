export function htmlStringToDomElement(html, text = null) {
    let template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;

    let element = template.content.firstChild;

    if (text) {
        element.lastElementChild.textContent = text;
    }

    return element;
}

export function getFlagFromCountryCode(countryCode) {
    if (countryCode === 'en') {
        countryCode = 'us';
    }

    if (countryCode.length === 5) {
        countryCode = countryCode.slice(-2);
    }

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}

export function getVisibilityIcon(value) {
    switch (value) {
        case 'public':
            return '<i class="select-icon fa fa-globe fa-fw"></i></i>';
        case 'private':
            return '<i class="select-icon fa fa-lock fa-fw"></i>';
        case 'internal':
            return '<i class="select-icon fa fa-user fa-fw"></i></i>';
    }

    return '';
}