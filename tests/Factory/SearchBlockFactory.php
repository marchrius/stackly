<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\SearchBlock;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

final class SearchBlockFactory extends PersistentProxyObjectFactory
{
    #[\Override]
    public static function class(): string
    {
        return SearchBlock::class;
    }

    #[\Override]
    protected function defaults(): array|callable
    {
        return [
        ];
    }

    #[\Override]
    protected function initialize(): static
    {
        return $this;
    }
}
