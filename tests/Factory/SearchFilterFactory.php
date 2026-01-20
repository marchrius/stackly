<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\SearchFilter;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\SearchFilter>
 */
final class SearchFilterFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
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
            'operator' => null,
            'type' => null,
            'value' => null,
        ];
    }

    #[\Override]
    protected function initialize(): static
    {
        return $this;
    }
}
