<?php

declare(strict_types=1);

namespace App\Tests\Factory;

use App\Entity\SearchBlock;
use Zenstruck\Foundry\Persistence\PersistentProxyObjectFactory;

/**
 * @extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory<\App\Entity\SearchBlock>
 */
final class SearchBlockFactory extends \Zenstruck\Foundry\Persistence\PersistentObjectFactory
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
