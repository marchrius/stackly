<?php

declare(strict_types=1);

namespace App\Twig;

use App\Enum\CurrencyEnum;
use App\Enum\RoleEnum;
use App\Service\LocaleHelper;
use Twig\Attribute\AsTwigFunction;

readonly class EnumExtension
{
    public function __construct(
        private LocaleHelper $localeHelper
    ) {
    }

    #[AsTwigFunction('getCurrencySymbol')]
    public function getCurrencySymbol(string $code): ?string
    {
        return CurrencyEnum::getSymbolFromCode($code);
    }

    #[AsTwigFunction('getRoleLabel')]
    public function getRoleLabel(string $role): string
    {
        return RoleEnum::getRoleLabel($role);
    }

    #[AsTwigFunction('getLocales')]
    public function getLocales(): array
    {
        return $this->localeHelper->getLocaleLabels();
    }

    #[AsTwigFunction('getLocaleLabel')]
    public function getLocaleLabel(string $code): string
    {
        $this->localeHelper->getLocaleLabels();

        return $this->localeHelper->getLocaleLabels()[$code] ?? $this->localeHelper->getLocaleLabels()[$this->localeHelper->getDefaultLocale()];
    }
}
