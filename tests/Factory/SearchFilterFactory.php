<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\SearchFilter;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

final class SearchFilterFactory extends PersistentProxyObjectFactory
{
    #[\Override]
    public static function class(): string
    {
        return SearchFilter::class;
    }

    #[\Override]
    protected function defaults(): array|callable
    {
        return [
            'operator' => self::faker()->text(),
            'type' => self::faker()->text(),
            'value' => self::faker()->text(),
        ];
    }

    #[\Override]
    protected function initialize(): static
    {
        return $this;
    }
}
